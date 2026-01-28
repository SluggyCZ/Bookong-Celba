const express = require('express');
const path = require('path');
const session = require('express-session');
const sequelize = require('./models/database');
const { Book, Warehouse, User } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'bookong-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ==================== ROUTES ====================

// Home Page
app.get('/', (req, res) => {
  res.render('layout', { 
    title: 'Home - Bookong Library',
    body: require('fs').readFileSync(path.join(__dirname, 'views', 'index.ejs'), 'utf8')
  });
});

// Auth Routes
// Login Page - GET
app.get('/auth/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('layout', {
    title: 'Login',
    body: require('fs').readFileSync(path.join(__dirname, 'views', 'auth', 'login.ejs'), 'utf8')
  });
});

// Login Page - POST
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.render('layout', {
        title: 'Login',
        body: require('fs').readFileSync(path.join(__dirname, 'views', 'auth', 'login.ejs'), 'utf8'),
        error: 'Invalid username or password'
      });
    }
    
    // Verify password
    const isValid = await user.validPassword(password);
    
    if (!isValid) {
      return res.render('layout', {
        title: 'Login',
        body: require('fs').readFileSync(path.join(__dirname, 'views', 'auth', 'login.ejs'), 'utf8'),
        error: 'Invalid username or password'
      });
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('layout', {
      title: 'Login',
      body: require('fs').readFileSync(path.join(__dirname, 'views', 'auth', 'login.ejs'), 'utf8'),
      error: 'An error occurred. Please try again.'
    });
  }
});

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Dashboard route
app.get('/dashboard', async (req, res) => {
  try {
    // Get statistics
    const totalBooks = await Book.count();
    const availableBooks = await Book.count({ where: { isAvailable: true } });
    const borrowedBooks = totalBooks - availableBooks;
    const totalWarehouses = await Warehouse.count();

    // Get recent books
    const recentBooks = await Book.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Warehouse,
        as: 'warehouse',
        attributes: ['name']
      }]
    });

    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        totalBooks,
        availableBooks,
        borrowedBooks,
        totalWarehouses
      },
      recentBooks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Import route files
const bookRoutes = require('./routes/books');
const warehouseRoutes = require('./routes/warehouses');

// Use routes
app.use('/books', bookRoutes);
app.use('/warehouses', warehouseRoutes);

// ==================== DATABASE & SERVER START ====================

// Initialize database and start server
async function startServer() {
  try {
    // Sync all models with database
    await sequelize.sync({ force: false });
    console.log('✓ Database connected and synchronized');
    
    // Create default admin user if no users exist
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ Home page: http://localhost:${PORT}`);
      console.log(`✓ Login page: http://localhost:${PORT}/auth/login`);
    });
  } catch (err) {
    console.error('✗ Unable to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
