# Certificate Generator - Quick Start Guide

## 🎯 Overview
This application helps you create and distribute personalized certificates in bulk. Perfect for events, courses, competitions, or any occasion requiring certificates.

## 📋 Sample Files Provided

### Certificate Template
- **Location**: `/app/backend/static/templates/sample_certificate.png`
- **Format**: PNG (1200x800px)
- **Features**: Pre-designed with border, title, and space for names

### Sample CSV File
- **Location**: `/tmp/sample_recipients.csv`
- **Format**: 
  ```csv
  name,email
  John Doe,john.doe@example.com
  Jane Smith,jane.smith@example.com
  Alice Johnson,alice.j@example.com
  Bob Williams,bob.w@example.com
  ```

## 🚀 Step-by-Step Usage

### Step 1: Create an Event (Admin)

1. Navigate to **Admin Panel** (`/admin`)
2. Click on **"Create Event"** tab
3. Fill in the event details:
   - **Event Name**: e.g., "Annual Conference 2025"
   - **Certificate Template**: Upload PNG or JPEG file
   - **Font Size**: Adjust as needed (default: 60)
   - **Font Color**: Pick a color that matches your template

4. **Select Text Position**:
   - Click on "Click to Select Position" button
   - The template preview will appear
   - Click exactly where you want the recipient's name to appear
   - A red dot will mark your selection
   - Position coordinates will be saved

5. Click **"Create Event"**

### Step 2: Generate Certificates (Admin)

1. Switch to **"Generate Certificates"** tab
2. Select your event from the dropdown
3. Prepare your CSV file with this format:
   ```csv
   name,email
   John Doe,john@example.com
   Jane Smith,jane@example.com
   ```
   ⚠️ **Important**: 
   - First row must be headers: `name,email`
   - Names will appear exactly as written in CSV
   - Emails are used for downloading

4. Upload the CSV file
5. Click **"Generate Certificates"**
6. Wait for confirmation showing how many certificates were generated

### Step 3: View & Share (Admin)

1. Switch to **"View Certificates"** tab
2. Select your event to see all generated certificates
3. Click **"Copy Download Link"** to get the shareable link
4. Share this link with your recipients via:
   - Email
   - WhatsApp
   - Social media
   - Event website

### Step 4: Download Certificate (Recipients)

1. Open the download link (e.g., `/download/event-id-here`)
2. Enter your **Full Name** (exactly as registered)
3. Enter your **Email Address** (exactly as registered)
4. Click **"Download Certificate"**
5. Your personalized certificate will download as PNG

## 💡 Tips & Best Practices

### For Creating Templates

- **Recommended Size**: 1200x800px or larger (landscape)
- **Text Area**: Leave clear space for names (avoid busy backgrounds)
- **Contrast**: Ensure font color contrasts well with background
- **Test First**: Create a test event with 2-3 names before bulk generation

### For CSV Files

- **Accuracy**: Double-check names and emails before uploading
- **Formatting**: Keep names as you want them to appear (Title Case recommended)
- **Special Characters**: Avoid special characters in names if possible
- **Email Case**: Case doesn't matter (system converts to lowercase)

### For Text Positioning

- **Center Names**: Most certificates look best with centered names
- **Preview**: Upload template first, then carefully select position
- **Font Size**: Adjust based on average name length
- **Test Generation**: Generate 1-2 test certificates before bulk processing

## 🎨 Customization Options

### Font Settings
- **Size**: 20-100 (default: 60)
- **Color**: Any hex color (e.g., #000000 for black)

### Template Design
- Create templates in any design software (Canva, Photoshop, etc.)
- Export as PNG or JPEG
- Keep file size reasonable (<2MB recommended)

## 🔧 Technical Notes

- **Storage**: All certificates stored in `/app/backend/static/certificates/`
- **Database**: Event and certificate data stored in MongoDB
- **Image Processing**: Uses Python Pillow library
- **Font**: DejaVu Sans Bold (system default)

## ❓ Troubleshooting

### "Certificate not found"
- Check name spelling (must match CSV exactly)
- Check email address (must match CSV exactly)
- Verify certificates were generated for that event

### "Failed to generate certificates"
- Check CSV format (must have name,email headers)
- Verify CSV file is not empty
- Ensure event was created successfully

### Template not showing
- Check file format (PNG or JPEG only)
- Try a smaller file size
- Refresh the page

## 📞 Need Help?

Check the main README.md for API documentation and technical details.

---

**Ready to start?** Visit `/admin` and create your first event!
