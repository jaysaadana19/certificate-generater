from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import os
import uuid
import re
import csv
from datetime import datetime
from typing import Optional
import time
from dotenv import load_dotenv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Load environment variables
load_dotenv()

app = FastAPI(title="Certificate Generator API")

# Configuration
PORT = int(os.getenv("PORT", 8001))
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
TEMPLATES_DIR = os.path.join(STATIC_DIR, "templates")
CERTIFICATES_DIR = os.path.join(STATIC_DIR, "certificates")

# Create directories
for directory in [STATIC_DIR, TEMPLATES_DIR, CERTIFICATES_DIR]:
    os.makedirs(directory, exist_ok=True)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# MongoDB connection with retry logic
db = None
mongo_client = None

async def connect_to_mongodb():
    global db, mongo_client
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "test_database")
    
    max_retries = 10
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to MongoDB (attempt {attempt + 1}/{max_retries})...")
            mongo_client = MongoClient(
                mongo_url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            # Test connection
            mongo_client.admin.command('ping')
            db = mongo_client[db_name]
            print("✅ Connected to MongoDB successfully")
            return True
        except ConnectionFailure as e:
            print(f"❌ MongoDB connection error: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Failed to connect to MongoDB after multiple attempts")
                return False
    return False

# Dependency to check database connection
async def get_db():
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected yet. Please try again.")
    return db

# Helper function to create slug
def create_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    return slug

# Startup event
@app.on_event("startup")
async def startup_event():
    await connect_to_mongodb()

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok" if db is not None else "degraded",
        "service": "certificate-generator",
        "database": "connected" if db is not None else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }

# Root endpoint
@app.get("/api")
async def root():
    return {"message": "Certificate Generator API - FastAPI"}

# Create event endpoint
@app.post("/api/events")
async def create_event(
    name: str = Form(...),
    text_position_x: int = Form(...),
    text_position_y: int = Form(...),
    font_size: int = Form(60),
    font_color: str = Form("#000000"),
    font_style: str = Form("normal"),
    template: UploadFile = File(...),
    database = Depends(get_db)
):
    try:
        # Validate template file
        if not template.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed")
        
        # Generate event ID and slug
        event_id = str(uuid.uuid4())
        slug = create_slug(name)
        
        # Check for duplicate slugs
        existing_slugs = list(database.events.find(
            {"slug": {"$regex": f"^{slug}(-\\d+)?$"}},
            {"slug": 1}
        ))
        
        if existing_slugs:
            slug_numbers = []
            for doc in existing_slugs:
                match = re.search(r'-(\d+)$', doc['slug'])
                if match:
                    slug_numbers.append(int(match.group(1)))
                elif doc['slug'] == slug:
                    slug_numbers.append(0)
            
            if slug_numbers:
                next_number = max(slug_numbers) + 1
                slug = f"{slug}-{next_number}"
        
        # Save template file
        file_ext = os.path.splitext(template.filename)[1]
        template_filename = f"{event_id}_template{file_ext}"
        template_path = os.path.join(TEMPLATES_DIR, template_filename)
        
        with open(template_path, "wb") as f:
            content = await template.read()
            f.write(content)
        
        # Create event document
        event = {
            "id": event_id,
            "slug": slug,
            "name": name,
            "template_path": f"templates/{template_filename}",
            "text_position_x": text_position_x,
            "text_position_y": text_position_y,
            "font_size": font_size,
            "font_color": font_color,
            "font_style": font_style,
            "created_at": datetime.utcnow().isoformat()
        }
        
        database.events.insert_one(event)
        
        # Remove _id for response
        event.pop("_id", None)
        
        return JSONResponse(content=event, status_code=201)
        
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create event: {str(e)}")

# Get all events
@app.get("/api/events")
async def get_events(limit: int = 100, database = Depends(get_db)):
    try:
        events = list(database.events.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit))
        
        return events
    except Exception as e:
        print(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

# Get event by slug
@app.get("/api/events/slug/{slug}")
async def get_event_by_slug(slug: str, database = Depends(get_db)):
    try:
        event = database.events.find_one({"slug": slug}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching event: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch event")

# Get event by ID
@app.get("/api/events/{event_id}")
async def get_event(event_id: str, database = Depends(get_db)):
    try:
        event = database.events.find_one({"id": event_id}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching event: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch event")

# Delete event
@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str, database = Depends(get_db)):
    try:
        # Delete event
        result = database.events.delete_one({"id": event_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Delete associated certificates
        database.certificates.delete_many({"event_id": event_id})
        
        return {"message": "Event and associated certificates deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting event: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete event")

# Generate certificates endpoint
@app.post("/api/events/{event_id}/generate")
async def generate_certificates(
    event_id: str,
    csv_file: UploadFile = File(...),
    database = Depends(get_db)
):
    try:
        # Get event
        event = database.events.find_one({"id": event_id}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Read and parse CSV
        content = await csv_file.read()
        csv_content = content.decode('utf-8').splitlines()
        csv_reader = csv.DictReader(csv_content)
        
        # Get existing emails to avoid duplicates
        existing_emails = set()
        for cert in database.certificates.find({"event_id": event_id}, {"email": 1}):
            existing_emails.add(cert.get("email", "").lower())
        
        # Load template image
        template_path = os.path.join(STATIC_DIR, event["template_path"])
        if not os.path.exists(template_path):
            raise HTTPException(status_code=404, detail="Template image not found")
        
        template_img = Image.open(template_path)
        
        # Prepare certificates to insert
        certificates_to_insert = []
        skipped = 0
        
        for row in csv_reader:
            name = row.get("name", "").strip()
            email = row.get("email", "").strip().lower()
            
            if not name or not email:
                skipped += 1
                continue
            
            if email in existing_emails:
                skipped += 1
                continue
            
            # Generate certificate
            cert_id = str(uuid.uuid4())
            cert_filename = f"{cert_id}.png"
            cert_path = os.path.join(CERTIFICATES_DIR, cert_filename)
            
            # Create certificate image
            img = template_img.copy()
            draw = ImageDraw.Draw(img)
            
            # Try to use a TrueType font, fallback to default
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", event["font_size"])
            except:
                font = ImageFont.load_default()
            
            # Draw text on certificate
            text_color = event["font_color"]
            draw.text(
                (event["text_position_x"], event["text_position_y"]),
                name,
                fill=text_color,
                font=font
            )
            
            # Save certificate
            img.save(cert_path, "PNG")
            
            # Create certificate document
            certificate = {
                "id": cert_id,
                "event_id": event_id,
                "name": name,
                "email": email,
                "certificate_path": f"certificates/{cert_filename}",
                "created_at": datetime.utcnow().isoformat()
            }
            
            certificates_to_insert.append(certificate)
            existing_emails.add(email)
        
        # Bulk insert certificates
        if certificates_to_insert:
            database.certificates.insert_many(certificates_to_insert)
        
        return {
            "message": f"Generated {len(certificates_to_insert)} certificates",
            "generated": len(certificates_to_insert),
            "skipped": skipped
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating certificates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate certificates: {str(e)}")

# Get certificates for an event
@app.get("/api/events/{event_id}/certificates")
async def get_certificates(event_id: str, limit: int = 100, database = Depends(get_db)):
    try:
        certificates = list(database.certificates.find(
            {"event_id": event_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit))
        
        return certificates
    except Exception as e:
        print(f"Error fetching certificates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch certificates")

# Export certificates as CSV
@app.get("/api/events/{event_id}/certificates/export")
async def export_certificates(event_id: str, database = Depends(get_db)):
    try:
        certificates = list(database.certificates.find(
            {"event_id": event_id},
            {"_id": 0}
        ).limit(10000))
        
        if not certificates:
            raise HTTPException(status_code=404, detail="No certificates found")
        
        # Create CSV in memory
        output = BytesIO()
        output.write(b"name,email,certificate_id,created_at\n")
        
        for cert in certificates:
            line = f"{cert['name']},{cert['email']},{cert['id']},{cert.get('created_at', '')}\n"
            output.write(line.encode('utf-8'))
        
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=certificates_{event_id}.csv"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting certificates: {e}")
        raise HTTPException(status_code=500, detail="Failed to export certificates")

# Download certificate
@app.post("/api/certificates/download")
async def download_certificate(
    event_slug: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    format: str = Form("png"),
    database = Depends(get_db)
):
    try:
        # Get event
        event = database.events.find_one({"slug": event_slug}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Find certificate
        certificate = database.certificates.find_one(
            {
                "event_id": event["id"],
                "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"},
                "email": email.lower()
            },
            {"_id": 0}
        )
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Get certificate file path
        cert_path = os.path.join(STATIC_DIR, certificate["certificate_path"])
        
        if not os.path.exists(cert_path):
            raise HTTPException(status_code=404, detail="Certificate file not found")
        
        if format.lower() == "pdf":
            # Convert PNG to PDF
            pdf_output = BytesIO()
            img = Image.open(cert_path)
            
            # Create PDF
            img_width, img_height = img.size
            c = canvas.Canvas(pdf_output, pagesize=(img_width, img_height))
            c.drawImage(cert_path, 0, 0, width=img_width, height=img_height)
            c.save()
            
            pdf_output.seek(0)
            
            return StreamingResponse(
                pdf_output,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=certificate_{certificate['id']}.pdf"}
            )
        else:
            # Return PNG
            return FileResponse(
                cert_path,
                media_type="image/png",
                filename=f"certificate_{certificate['id']}.png"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading certificate: {e}")
        raise HTTPException(status_code=500, detail="Failed to download certificate")

# Verify certificate
@app.get("/api/certificates/verify/{cert_id}")
async def verify_certificate(cert_id: str, database = Depends(get_db)):
    try:
        certificate = database.certificates.find_one({"id": cert_id}, {"_id": 0})
        
        if certificate:
            return {
                "valid": True,
                "name": certificate["name"],
                "event_id": certificate["event_id"]
            }
        else:
            return {
                "valid": False,
                "message": "Certificate not found"
            }
        
    except Exception as e:
        print(f"Error verifying certificate: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify certificate")

# Dashboard statistics
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(database = Depends(get_db)):
    try:
        # Count total events
        total_events = database.events.count_documents({})
        
        # Count total certificates
        total_certificates = database.certificates.count_documents({})
        
        # Get recent events
        recent_events = list(database.events.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(10))
        
        # Get certificate counts by event
        pipeline = [
            {"$group": {"_id": "$event_id", "count": {"$sum": 1}}},
            {"$lookup": {
                "from": "events",
                "localField": "_id",
                "foreignField": "id",
                "as": "event_info"
            }},
            {"$unwind": "$event_info"},
            {"$project": {
                "event_id": "$_id",
                "event_name": "$event_info.name",
                "count": 1,
                "_id": 0
            }},
            {"$sort": {"count": -1}},
            {"$limit": 100}
        ]
        
        certificates_by_event = list(database.certificates.aggregate(pipeline))
        
        return {
            "totalEvents": total_events,
            "totalCertificates": total_certificates,
            "recentEvents": recent_events,
            "certificatesByEvent": certificates_by_event
        }
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats")

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 FastAPI backend starting on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
