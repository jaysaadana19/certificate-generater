# Certificate Generator

A full-stack application for creating and distributing personalized certificates in bulk.

## Features

### For Admins
- Upload certificate templates (PNG/JPEG)
- Visual text positioning - click on template to select where names appear
- Configure font size and color
- Upload CSV files with recipient information
- Bulk certificate generation
- View all generated certificates
- Share download links with recipients

### For Recipients
- Simple download interface
- Enter name and email to get certificate
- Instant download

## Tech Stack

- **Backend**: FastAPI + Python
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **Image Processing**: Pillow (PIL)

## Usage

### Admin Panel (`/admin`)

#### 1. Create Event
1. Enter event name
2. Upload certificate template (PNG or JPEG)
3. Configure font size and color
4. Click on the template preview to select where the recipient's name should appear
5. Click "Create Event"

#### 2. Generate Certificates
1. Select an event from the dropdown
2. Upload CSV file with the following format:
   ```csv
   name,email
   John Doe,john@example.com
   Jane Smith,jane@example.com
   ```
3. Click "Generate Certificates"
4. The system will create personalized certificates for each recipient

#### 3. View Certificates
1. Select an event to view all generated certificates
2. Copy the download link to share with recipients
3. Recipients can use this link to download their certificates

### Download Page (`/download/:eventId`)

Recipients can:
1. Visit the download link shared by the admin
2. Enter their exact name and email (as provided in CSV)
3. Download their personalized certificate

## Sample Files

Sample certificate template: `/app/backend/static/templates/sample_certificate.png`
Sample CSV file: `/tmp/sample_recipients.csv`

## API Endpoints

### Events
- `POST /api/events` - Create new event
- `GET /api/events` - Get all events
- `GET /api/events/{event_id}` - Get specific event

### Certificates
- `POST /api/events/{event_id}/generate` - Generate certificates from CSV
- `GET /api/events/{event_id}/certificates` - Get all certificates for event
- `POST /api/certificates/download` - Download certificate by name and email

## Notes

- Certificates are stored in `/app/backend/static/certificates/`
- Templates are stored in `/app/backend/static/templates/`
- All data is persisted in MongoDB
- Name matching is case-insensitive for downloads
- Email matching is case-insensitive and stored in lowercase

## Getting Started

1. Visit `/admin` to create your first event
2. Upload a certificate template
3. Upload a CSV with recipient data
4. Generate certificates
5. Share the download link with recipients!
