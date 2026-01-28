const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const { Book, Warehouse } = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// List all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [{
        model: Warehouse,
        as: 'warehouse',
        attributes: ['name', 'location']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.render('books/list', {
      title: 'Books',
      books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Error fetching books');
  }
});

// Show add book form
router.get('/add', requireAuth, async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      order: [['name', 'ASC']]
    });

    res.render('books/add', {
      title: 'Add New Book',
      warehouses
    });
  } catch (error) {
    console.error('Error loading add book form:', error);
    res.status(500).send('Error loading form');
  }
});

// Handle add book form submission
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, warehouseId, isAvailable } = req.body;

    // Validation
    if (!title || !author || !warehouseId) {
      const warehouses = await Warehouse.findAll({ order: [['name', 'ASC']] });
      return res.render('books/add', {
        title: 'Add New Book',
        warehouses,
        error: 'Title, author, and warehouse are required'
      });
    }

    await Book.create({
      title,
      author,
      isbn: isbn || null,
      warehouseId,
      isAvailable: isAvailable === 'true'
    });

    res.redirect('/books?success=Book added successfully');
  } catch (error) {
    console.error('Error adding book:', error);
    const warehouses = await Warehouse.findAll({ order: [['name', 'ASC']] });
    res.render('books/add', {
      title: 'Add New Book',
      warehouses,
      error: 'Error adding book: ' + error.message
    });
  }
});

// Show import form
router.get('/import', requireAuth, (req, res) => {
  res.render('books/import', {
    title: 'Import Books from Excel'
  });
});

// Handle Excel import
router.post('/import', requireAuth, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.render('books/import', {
        title: 'Import Books from Excel',
        error: 'Please select an Excel file to upload'
      });
    }

    // Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.render('books/import', {
        title: 'Import Books from Excel',
        error: 'The Excel file is empty'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Expected columns: title, author, isbn, warehouseId
        const title = row.title || row.Title;
        const author = row.author || row.Author;
        const isbn = row.isbn || row.ISBN || null;
        const warehouseId = row.warehouseId || row.WarehouseId || row.warehouse_id;

        if (!title || !author || !warehouseId) {
          errors.push(`Row ${i + 2}: Missing required fields (title, author, warehouseId)`);
          errorCount++;
          continue;
        }

        // Check if warehouse exists
        const warehouse = await Warehouse.findByPk(warehouseId);
        if (!warehouse) {
          errors.push(`Row ${i + 2}: Warehouse ID ${warehouseId} not found`);
          errorCount++;
          continue;
        }

        await Book.create({
          title,
          author,
          isbn,
          warehouseId,
          isAvailable: true
        });

        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
        errorCount++;
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    let message = `Import completed: ${successCount} books added successfully`;
    if (errorCount > 0) {
      message += `, ${errorCount} errors occurred`;
    }

    res.render('books/import', {
      title: 'Import Books from Excel',
      success: message,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('Error importing books:', error);
    res.render('books/import', {
      title: 'Import Books from Excel',
      error: 'Error importing books: ' + error.message
    });
  }
});

// Book detail with QR code
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{
        model: Warehouse,
        as: 'warehouse'
      }]
    });

    if (!book) {
      return res.status(404).send('Book not found');
    }

    // Generate QR code for book ID
    const qrCodeUrl = await QRCode.toDataURL(`BOOK-${book.id}`);

    res.render('books/detail', {
      title: book.title,
      book,
      qrCodeUrl
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).send('Error fetching book details');
  }
});

module.exports = router;
