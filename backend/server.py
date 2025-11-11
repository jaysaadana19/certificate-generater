from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import io
import csv
from PIL import Image, ImageDraw, ImageFont
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Static files
STATIC_DIR = ROOT_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / "templates").mkdir(exist_ok=True)
(STATIC_DIR / "certificates").mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Models
class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    template_path: str
    text_position_x: int
    text_position_y: int
    font_size: int = 60
    font_color: str = "#000000"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    name: str
    text_position_x: int
    text_position_y: int
    font_size: int = 60
    font_color: str = "#000000"

class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    name: str
    email: str
    certificate_path: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CertificateDownload(BaseModel):
    name: str
    email: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Certificate Generator API"}

@api_router.post("/events", response_model=Event)
async def create_event(
    name: str = Form(...),
    template: UploadFile = File(...),
    text_position_x: int = Form(...),
    text_position_y: int = Form(...),
    font_size: int = Form(60),
    font_color: str = Form("#000000")
):
    """Create a new event with certificate template"""
    event_id = str(uuid.uuid4())
    
    # Save template file
    file_extension = template.filename.split(".")[-1].lower()
    if file_extension not in ["png", "jpg", "jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed")
    
    template_filename = f"{event_id}_template.{file_extension}"
    template_path = STATIC_DIR / "templates" / template_filename
    
    with open(template_path, "wb") as buffer:
        shutil.copyfileobj(template.file, buffer)
    
    # Create event document
    event_obj = Event(
        id=event_id,
        name=name,
        template_path=f"templates/{template_filename}",
        text_position_x=text_position_x,
        text_position_y=text_position_y,
        font_size=font_size,
        font_color=font_color
    )
    
    doc = event_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.events.insert_one(doc)
    return event_obj

@api_router.get("/events", response_model=List[Event])
async def get_events():
    """Get all events"""
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """Get a specific event"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return event

@api_router.post("/events/{event_id}/generate")
async def generate_certificates(
    event_id: str,
    csv_file: UploadFile = File(...)
):
    """Generate certificates from CSV file"""
    # Get event
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Parse CSV
    content = await csv_file.read()
    csv_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_content))
    
    # Validate CSV headers
    if 'name' not in csv_reader.fieldnames or 'email' not in csv_reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must have 'name' and 'email' columns")
    
    generated_count = 0
    errors = []
    
    for row in csv_reader:
        try:
            name = row.get('name', '').strip()
            email = row.get('email', '').strip()
            
            if not name or not email:
                continue
            
            # Check if certificate already exists
            existing = await db.certificates.find_one({
                "event_id": event_id,
                "email": email.lower()
            })
            
            if existing:
                continue
            
            # Generate certificate
            template_path = STATIC_DIR / event['template_path'].lstrip('/')
            
            # Open template
            img = Image.open(template_path)
            draw = ImageDraw.Draw(img)
            
            # Load font (use default if custom font not available)
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", event['font_size'])
            except:
                font = ImageFont.load_default()
            
            # Parse color
            color = event['font_color']
            if color.startswith('#'):
                color = color.lstrip('#')
                color = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            
            # Draw text
            draw.text(
                (event['text_position_x'], event['text_position_y']),
                name,
                fill=color,
                font=font
            )
            
            # Save certificate
            cert_id = str(uuid.uuid4())
            cert_filename = f"{cert_id}.png"
            cert_path = STATIC_DIR / "certificates" / cert_filename
            img.save(cert_path, "PNG")
            
            # Save to database
            cert_obj = Certificate(
                id=cert_id,
                event_id=event_id,
                name=name,
                email=email.lower(),
                certificate_path=f"/static/certificates/{cert_filename}"
            )
            
            doc = cert_obj.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            
            await db.certificates.insert_one(doc)
            generated_count += 1
            
        except Exception as e:
            errors.append(f"Error for {name}: {str(e)}")
    
    return {
        "success": True,
        "generated": generated_count,
        "errors": errors
    }

@api_router.get("/events/{event_id}/certificates", response_model=List[Certificate])
async def get_event_certificates(event_id: str):
    """Get all certificates for an event"""
    certificates = await db.certificates.find(
        {"event_id": event_id},
        {"_id": 0}
    ).to_list(10000)
    
    for cert in certificates:
        if isinstance(cert['created_at'], str):
            cert['created_at'] = datetime.fromisoformat(cert['created_at'])
    
    return certificates

@api_router.post("/certificates/download")
async def download_certificate(data: CertificateDownload):
    """Download certificate by name and email"""
    certificate = await db.certificates.find_one(
        {
            "name": {"$regex": f"^{data.name}$", "$options": "i"},
            "email": data.email.lower()
        },
        {"_id": 0}
    )
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    cert_path = STATIC_DIR / certificate['certificate_path'].lstrip('/')
    
    if not cert_path.exists():
        raise HTTPException(status_code=404, detail="Certificate file not found")
    
    return FileResponse(
        cert_path,
        media_type="image/png",
        filename=f"{certificate['name']}_certificate.png"
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()