const express = require('express');
const router = express.Router();
const { Warehouse, Book } = require('../models');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// List all warehouses
router.get('/', async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      include: [{
        model: Book,
        as: 'books',
        attributes: ['id']
      }],
      order: [['name', 'ASC']]
    });

    // Add book count to each warehouse
    const warehousesWithCount = warehouses.map(w => ({
      ...w.toJSON(),
      bookCount: w.books ? w.books.length : 0
    }));

    res.render('warehouses/list', {
      title: 'Warehouses',
      warehouses: warehousesWithCount
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).send('Error fetching warehouses');
  }
});

// Show add warehouse form
router.get('/add', requireAuth, (req, res) => {
  res.render('warehouses/add', {
    title: 'Add New Warehouse'
  });
});

// Handle add warehouse form submission
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.render('warehouses/add', {
        title: 'Add New Warehouse',
        error: 'Name and location are required'
      });
    }

    await Warehouse.create({ name, location });
    res.redirect('/warehouses?success=Warehouse added successfully');
  } catch (error) {
    console.error('Error adding warehouse:', error);
    res.render('warehouses/add', {
      title: 'Add New Warehouse',
      error: 'Error adding warehouse: ' + error.message
    });
  }
});

module.exports = router;
