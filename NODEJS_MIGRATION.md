# Backend Migration: Python → Node.js ✅

## Migration Complete!

The certificate generator backend has been successfully migrated from **Python (FastAPI)** to **Node.js (Express)**.

## What Changed

### Technology Stack

**Before (Python):**
- Framework: FastAPI
- Database: Motor (async MongoDB driver)
- Image Processing: Pillow (PIL)
- Server: Uvicorn

**After (Node.js):**
- Framework: Express.js
- Database: MongoDB native driver
- Image Processing: Jimp
- Server: Node.js HTTP server

### File Structure

```
/app/backend/
├── package.json          # Node.js dependencies
├── server.js            # Main Express server (replaces server.py)
├── .env                 # Environment variables (unchanged)
├── static/              # Static files (unchanged)
│   ├── templates/       # Certificate templates
│   └── certificates/    # Generated certificates
└── node_modules/        # Node.js packages
```

## Dependencies

### Main Packages
- `express` - Web framework
- `mongodb` - MongoDB driver
- `multer` - File upload handling
- `jimp` - Image processing (text overlay)
- `csv-parser` - CSV file parsing
- `uuid` - ID generation
- `cors` - CORS middleware
- `dotenv` - Environment variables

## API Compatibility

All API endpoints remain **100% compatible** with the frontend:

### Events
- ✅ `POST /api/events` - Create event with template
- ✅ `GET /api/events` - Get all events
- ✅ `GET /api/events/:eventId` - Get event by ID
- ✅ `GET /api/events/slug/:slug` - Get event by slug

### Certificates
- ✅ `POST /api/events/:eventId/generate` - Generate certificates from CSV
- ✅ `GET /api/events/:eventId/certificates` - Get event certificates
- ✅ `GET /api/events/:eventId/certificates/export` - Export as CSV
- ✅ `POST /api/certificates/download` - Download certificate

### Dashboard
- ✅ `GET /api/dashboard/stats` - Get statistics

### Static Files
- ✅ `/static/*` - Serve images and files

## Key Features Maintained

1. **Event Slug URLs** - Human-readable URLs like `/download/tech-summit-2025`
2. **CSV Parsing** - Upload recipient lists
3. **Image Text Overlay** - Dynamic certificate generation
4. **MongoDB Integration** - Same database, same collections
5. **File Uploads** - Template and CSV handling
6. **Dashboard Stats** - Analytics and reporting
7. **Bulk Export** - CSV data export

## Image Processing

### Font Handling
Jimp uses built-in bitmap fonts. Font sizes are mapped as follows:
- 128px+ → FONT_SANS_128_BLACK
- 64-127px → FONT_SANS_64_BLACK
- 32-63px → FONT_SANS_32_BLACK
- <32px → FONT_SANS_16_BLACK

**Note:** For production with custom fonts, consider using:
- `sharp` with SVG text overlay
- `canvas` (requires native dependencies)
- External service like Cloudinary or Imgix

## Environment Variables

No changes required! Same `.env` file:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

## Supervisor Configuration

Updated `/etc/supervisor/conf.d/supervisord.conf`:
```ini
[program:backend]
command=/usr/bin/node server.js
directory=/app/backend
autostart=true
autorestart=true
```

## Testing

All endpoints tested and working:
- ✅ Event creation
- ✅ Certificate generation
- ✅ Dashboard stats
- ✅ File downloads
- ✅ Slug-based routing

## Performance Notes

### Advantages of Node.js
- ✅ Single-threaded, event-driven (efficient for I/O)
- ✅ Native async/await support
- ✅ Large NPM ecosystem
- ✅ Fast JSON processing
- ✅ Better WebSocket support (for future features)

### Considerations
- Jimp is pure JavaScript (slower than native Pillow)
- For high-volume certificate generation, consider:
  - Worker threads for parallel processing
  - Queue system (Bull, BullMQ)
  - Caching with Redis

## Migration Commands

If you need to rollback to Python:
```bash
# Restore Python backend
sudo bash -c 'cat > /etc/supervisor/conf.d/supervisord.conf << "EOF"
[program:backend]
command=/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
...
EOF'

sudo supervisorctl restart backend
```

## Future Enhancements

With Node.js, you can now easily add:
1. **Real-time features** - Socket.IO for live updates
2. **Blockchain integration** - web3.js, ethers.js
3. **IPFS storage** - ipfs-http-client
4. **Advanced auth** - Passport.js, JWT
5. **Webhooks** - Event notifications
6. **Better image processing** - Sharp with custom fonts

## Package Scripts

```bash
# Development with auto-reload
cd /app/backend
npm run dev

# Production
npm start

# Install dependencies
npm install
# or
yarn install
```

## Logs

Backend logs location:
- **stdout**: `/var/log/supervisor/backend_node.out.log`
- **stderr**: `/var/log/supervisor/backend_node.err.log`

View logs:
```bash
tail -f /var/log/supervisor/backend_node.*.log
```

## Status

🎉 **Migration Status: COMPLETE**

- Backend: Node.js + Express ✅
- Database: MongoDB (unchanged) ✅
- Frontend: React (unchanged) ✅
- All features: Working ✅

The application is fully operational with the new Node.js backend!
