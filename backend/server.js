const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const PDFDocument = require('pdfkit');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Create directories
const STATIC_DIR = path.join(__dirname, 'static');
const TEMPLATES_DIR = path.join(STATIC_DIR, 'templates');
const CERTIFICATES_DIR = path.join(STATIC_DIR, 'certificates');

[STATIC_DIR, TEMPLATES_DIR, CERTIFICATES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use('/static', express.static(STATIC_DIR));

// Configure multer for template uploads
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMPLATES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}_template${ext}`);
  }
});

const uploadTemplate = multer({ 
  storage: templateStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG files are allowed'));
    }
  }
});

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.csv`);
  }
});

const uploadCSV = multer({ 
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// MongoDB connection
let db;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'test_database';

MongoClient.connect(mongoUrl)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Helper function to create slug
function createSlug(name) {
  let slug = name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
  return slug;
}

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Certificate Generator API - Node.js' });
});

// Create event
app.post('/api/events', uploadTemplate.single('template'), async (req, res) => {
  try {
    const { name, text_position_x, text_position_y, font_size = 60, font_color = '#000000', font_style = 'normal' } = req.body;
    
    if (!name || !req.file || !text_position_x || !text_position_y) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventId = uuidv4();
    let slug = createSlug(name);
    
    // Check for duplicate slugs
    const existingSlug = await db.collection('events').findOne({ slug });
    if (existingSlug) {
      let counter = 1;
      while (await db.collection('events').findOne({ slug: `${slug}-${counter}` })) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    const event = {
      id: eventId,
      slug,
      name,
      template_path: `templates/${req.file.filename}`,
      text_position_x: parseInt(text_position_x),
      text_position_y: parseInt(text_position_y),
      font_size: parseInt(font_size),
      font_color,
      created_at: new Date().toISOString()
    };

    await db.collection('events').insertOne(event);
    delete event._id;
    
    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.collection('events')
      .find({}, { projection: { _id: 0 } })
      .toArray();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by slug
app.get('/api/events/slug/:slug', async (req, res) => {
  try {
    const event = await db.collection('events')
      .findOne({ slug: req.params.slug }, { projection: { _id: 0 } });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Get event by ID
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const event = await db.collection('events')
      .findOne({ id: req.params.eventId }, { projection: { _id: 0 } });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Generate certificates (optimized for bulk operations)
app.post('/api/events/:eventId/generate', uploadCSV.single('csv_file'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await db.collection('events').findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    console.log(`Starting certificate generation for event: ${event.name}`);
    
    const results = [];
    const errors = [];
    
    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete temp CSV file
    fs.unlinkSync(req.file.path);

    console.log(`CSV parsed: ${results.length} rows`);

    // Get existing certificates for this event (bulk check)
    const existingEmails = await db.collection('certificates')
      .find({ event_id: eventId }, { projection: { email: 1 } })
      .toArray();
    const existingEmailSet = new Set(existingEmails.map(c => c.email));

    console.log(`Found ${existingEmailSet.size} existing certificates`);

    // Load template and fonts once (outside loop for performance)
    // Handle both old format (/static/templates/...) and new format (templates/...)
    let templatePath;
    if (event.template_path.startsWith('/static/')) {
      templatePath = path.join(__dirname, event.template_path);
    } else if (event.template_path.startsWith('static/')) {
      templatePath = path.join(__dirname, event.template_path);
    } else {
      templatePath = path.join(STATIC_DIR, event.template_path);
    }
    const templateImage = await Jimp.read(templatePath);
    
    // Parse color once
    let color = event.font_color;
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      color = Jimp.rgbaToInt(r, g, b, 255);
    } else {
      color = Jimp.rgbaToInt(0, 0, 0, 255);
    }
    
    // Load fonts once
    let mainFont;
    if (event.font_size >= 128) {
      mainFont = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    } else if (event.font_size >= 64) {
      mainFont = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    } else if (event.font_size >= 32) {
      mainFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    } else {
      mainFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    }
    const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    console.log('Template and fonts loaded');

    let generatedCount = 0;
    let skippedCount = 0;
    const certificatesToInsert = [];
    const BATCH_SIZE = 100; // Process in batches

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      
      try {
        const name = row.name?.trim();
        const email = row.email?.trim().toLowerCase();

        if (!name || !email) {
          errors.push(`Row ${i + 1}: Missing name or email`);
          continue;
        }

        // Skip if already exists
        if (existingEmailSet.has(email)) {
          skippedCount++;
          continue;
        }

        // Clone template for this certificate
        const image = templateImage.clone();
        
        // Generate certificate ID
        const certId = uuidv4();
        
        // Print name on image
        image.print(
          mainFont,
          event.text_position_x,
          event.text_position_y,
          {
            text: name,
            alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
          }
        );
        
        // Add certificate ID at bottom right corner
        const certIdText = `Certificate ID: ${certId}`;
        const textWidth = Jimp.measureText(smallFont, certIdText);
        const xPos = image.bitmap.width - textWidth - 30;
        const yPos = image.bitmap.height - 40;
        
        image.print(
          smallFont,
          xPos,
          yPos,
          {
            text: certIdText,
            alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
          }
        );
        
        // Save certificate
        const certFilename = `${certId}.png`;
        const certPath = path.join(CERTIFICATES_DIR, certFilename);
        
        await image.writeAsync(certPath);
        
        // Prepare certificate document for bulk insert
        const certificate = {
          id: certId,
          event_id: eventId,
          name,
          email,
          certificate_path: `certificates/${certFilename}`,
          created_at: new Date().toISOString()
        };
        
        certificatesToInsert.push(certificate);
        generatedCount++;

        // Bulk insert every BATCH_SIZE certificates
        if (certificatesToInsert.length >= BATCH_SIZE) {
          await db.collection('certificates').insertMany(certificatesToInsert);
          console.log(`Inserted batch: ${certificatesToInsert.length} certificates`);
          certificatesToInsert.length = 0; // Clear array
        }

        // Log progress for large batches
        if ((i + 1) % 100 === 0) {
          console.log(`Progress: ${i + 1}/${results.length} processed, ${generatedCount} generated`);
        }
        
      } catch (err) {
        console.error(`Error processing row ${i + 1}:`, err);
        errors.push(`Row ${i + 1} (${row.name || 'unknown'}): ${err.message}`);
      }
    }

    // Insert remaining certificates
    if (certificatesToInsert.length > 0) {
      await db.collection('certificates').insertMany(certificatesToInsert);
      console.log(`Inserted final batch: ${certificatesToInsert.length} certificates`);
    }

    console.log(`Generation complete: ${generatedCount} generated, ${skippedCount} skipped, ${errors.length} errors`);

    res.json({
      success: true,
      generated: generatedCount,
      errors
    });
    
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ error: 'Failed to generate certificates' });
  }
});

// Get certificates for event
app.get('/api/events/:eventId/certificates', async (req, res) => {
  try {
    const certificates = await db.collection('certificates')
      .find({ event_id: req.params.eventId }, { projection: { _id: 0 } })
      .toArray();
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Export certificates as CSV
app.get('/api/events/:eventId/certificates/export', async (req, res) => {
  try {
    const certificates = await db.collection('certificates')
      .find({ event_id: req.params.eventId }, { projection: { _id: 0 } })
      .toArray();
    
    if (certificates.length === 0) {
      return res.status(404).json({ error: 'No certificates found' });
    }

    // Create CSV
    let csv = 'Name,Email,Generated At,Certificate ID\n';
    certificates.forEach(cert => {
      const date = new Date(cert.created_at).toLocaleString();
      csv += `"${cert.name}","${cert.email}","${date}","${cert.id}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=certificates_${req.params.eventId}.csv`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting certificates:', error);
    res.status(500).json({ error: 'Failed to export certificates' });
  }
});

// Download certificate
app.post('/api/certificates/download', async (req, res) => {
  try {
    const { name, email, format = 'png' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const certificate = await db.collection('certificates').findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      email: email.toLowerCase()
    }, { projection: { _id: 0 } });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certPath = path.join(STATIC_DIR, certificate.certificate_path);
    
    if (!fs.existsSync(certPath)) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    // If PNG format, send directly
    if (format === 'png') {
      res.download(certPath, `${certificate.name}_certificate.png`);
      return;
    }

    // If PDF format, convert PNG to PDF
    if (format === 'pdf') {
      const image = await Jimp.read(certPath);
      const imgWidth = image.bitmap.width;
      const imgHeight = image.bitmap.height;
      
      // Create PDF with same dimensions as image
      const doc = new PDFDocument({
        size: [imgWidth, imgHeight],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.name}_certificate.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add image to PDF
      doc.image(certPath, 0, 0, {
        width: imgWidth,
        height: imgHeight
      });
      
      doc.end();
      return;
    }

    res.status(400).json({ error: 'Invalid format. Use "png" or "pdf"' });
    
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// Verify certificate by ID
app.get('/api/certificates/verify/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    
    const certificate = await db.collection('certificates')
      .findOne({ id: certId }, { projection: { _id: 0 } });
    
    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        error: 'Certificate not found' 
      });
    }
    
    // Get event details
    const event = await db.collection('events')
      .findOne({ id: certificate.event_id }, { projection: { _id: 0, name: 1, slug: 1 } });
    
    res.json({
      valid: true,
      certificate: {
        id: certificate.id,
        name: certificate.name,
        email: certificate.email,
        issued_at: certificate.created_at,
        event_name: event?.name || 'Unknown Event',
        event_slug: event?.slug || null
      }
    });
    
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalEvents = await db.collection('events').countDocuments();
    const totalCertificates = await db.collection('certificates').countDocuments();
    
    const recentEvents = await db.collection('events')
      .find({}, { projection: { _id: 0, name: 1, slug: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    // Certificates by event
    const certCounts = await db.collection('certificates')
      .aggregate([
        {
          $group: {
            _id: '$event_id',
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();
    
    const certificatesByEvent = [];
    for (const item of certCounts) {
      const event = await db.collection('events')
        .findOne({ id: item._id }, { projection: { _id: 0, name: 1, slug: 1 } });
      
      if (event) {
        certificatesByEvent.push({
          event_id: item._id,
          event_name: event.name,
          event_slug: event.slug,
          count: item.count
        });
      }
    }

    res.json({
      total_events: totalEvents,
      total_certificates: totalCertificates,
      recent_events: recentEvents,
      certificates_by_event: certificatesByEvent
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Node.js backend running on port ${PORT}`);
  console.log(`📁 Static files served from: ${STATIC_DIR}`);
});