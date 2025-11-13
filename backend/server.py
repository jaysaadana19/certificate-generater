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

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 FastAPI backend starting on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
