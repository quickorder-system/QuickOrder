require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const orderRoutes = require('./src/routes/orders');
const authRoutes = require('./src/routes/auth');
const uploadRoutes = require('./src/routes/upload');
const inventoryRoutes = require('./src/routes/inventory');
const healthRoutes = require('./src/routes/health');
const reportsRoutes = require('./src/routes/reports');
const errorHandler = require('./src/middleware/errorHandler');
const emailService = require('./src/services/email.service');
const User = require('./src/models/user');
const InventoryItem = require('./src/models/inventory');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "data:", "blob:"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "data:", "blob:", "'unsafe-eval'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'", "data:"],
            styleSrc: ["'self'", "data:", "blob:", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            workerSrc: ["'self'", "data:", "blob:"],
            childSrc: ["'self'", "data:", "blob:"],
            frameSrc: ["'self'", "data:", "blob:"],
            frameAncestors: ["'self'", "data:", "blob:"],
        },
    },
}));

// Apply JSON and URL-encoded parsers, but exclude file upload routes
app.use((req, res, next) => {
    if (req.path === '/api/upload') {
        return next(); // Skip body parsers for upload route
    }
    express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
    if (req.path === '/api/upload') {
        return next(); // Skip body parsers for upload route
    }
    express.urlencoded({ extended: false, limit: '50mb' })(req, res, next);
});

// Add a middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rate limiting (apply to all requests)
/*
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);
*/

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirect root to the user homepage
app.get('/', (req, res) => {
    res.redirect('/QuickOrder.html');
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling middleware (should be last)
errorHandler(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected...');
    seedTestUsers(); // Create test users on startup
    seedInventory(); // Create test inventory items on startup
    emailService.verifyEmailConfig(); // Verify email service on startup
})
.catch(err => console.error(err));

// Seed function to create test users
async function seedTestUsers() {
    try {
        // Check if admin user exists
        let adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            adminUser = new User({
                username: 'admin',
                password: 'admin123', // Will be hashed by pre-save middleware
                role: 'admin'
            });
            await adminUser.save();
            console.log('✓ Test admin user created (username: admin, password: admin123)');
        } else {
            // Verify the password is correctly hashed (try to log in)
            const bcrypt = require('bcrypt');
            const isMatch = await bcrypt.compare('admin123', adminUser.password);
            if (!isMatch) {
                // Password is incorrect (likely double-hashed), reset it
                adminUser.password = 'admin123';
                await adminUser.save();
                console.log('✓ Test admin user password reset (username: admin, password: admin123)');
            }
        }

        // Check if owner user exists
        let ownerUser = await User.findOne({ username: 'owner' });
        if (!ownerUser) {
            ownerUser = new User({
                username: 'owner',
                password: 'owner123', // Will be hashed by pre-save middleware
                role: 'owner'
            });
            await ownerUser.save();
            console.log('✓ Test owner user created (username: owner, password: owner123)');
        } else {
            // Verify the password is correctly hashed (try to log in)
            const bcrypt = require('bcrypt');
            const isMatch = await bcrypt.compare('owner123', ownerUser.password);
            if (!isMatch) {
                // Password is incorrect (likely double-hashed), reset it
                ownerUser.password = 'owner123';
                await ownerUser.save();
                console.log('✓ Test owner user password reset (username: owner, password: owner123)');
            }
        }
    } catch (error) {
        console.error('Error seeding test users:', error.message);
    }
}

// Seed function to create test inventory items
async function seedInventory() {
    try {
        const existingCount = await InventoryItem.countDocuments();
        if (existingCount > 0) {
            console.log(`✓ Inventory already has ${existingCount} items, skipping seed`);
            return;
        }

        const sampleItems = [
            // Burgers (burger)
            {
                itemName: 'Beef Burger',
                category: 'burger',
                price: 89,
                description: 'Juicy beef patty with fresh lettuce, tomatoes, onions, and our special sauce on a toasted bun.',
                quantity: 50,
                image: '/image/beefburger.jpg',
                isAvailable: true
            },
            {
                itemName: 'Chicken Burger',
                category: 'burger',
                price: 79,
                description: 'Crispy fried chicken fillet with creamy mayo, pickles, and fresh vegetables on a soft bun.',
                quantity: 45,
                image: '/image/chickenburger.jpg',
                isAvailable: true
            },
            // Pizza (pizza)
            {
                itemName: 'Pepperoni Pizza',
                category: 'pizza',
                price: 299,
                description: 'Classic pizza with mozzarella cheese and pepperoni slices baked to perfection.',
                quantity: 20,
                image: '/image/pepperonipizza.jpg',
                isAvailable: true
            },
            {
                itemName: 'Vegetarian Pizza',
                category: 'pizza',
                price: 249,
                description: 'Fresh vegetables including bell peppers, mushrooms, olives, and onions on a delicious crust.',
                quantity: 18,
                image: '/image/vegpizza.jpg',
                isAvailable: true
            },
            // Snacks/Others (others)
            {
                itemName: 'French Fries',
                category: 'others',
                price: 59,
                description: 'Golden crispy French fries served with your choice of dipping sauce.',
                quantity: 60,
                image: '/image/frenchfries.jpg',
                isAvailable: true
            },
            // Drinks (drinks)
            {
                itemName: 'Iced Tea',
                category: 'drinks',
                price: 35,
                description: 'Refreshing iced tea served cold with ice.',
                quantity: 80,
                image: '/image/icedtea.jpg',
                isAvailable: true
            },
            {
                itemName: 'Milk Shake',
                category: 'drinks',
                price: 65,
                description: 'Creamy milk shake available in vanilla, chocolate, or strawberry flavor.',
                quantity: 40,
                image: '/image/milkshake.jpg',
                isAvailable: true
            },
            // Rice Meals (rice)
            {
                itemName: 'Chicken Rice Meal',
                category: 'rice',
                price: 120,
                description: 'Tender chicken served with fluffy steamed rice and vegetables.',
                quantity: 35,
                image: '/image/chickenrice.jpg',
                isAvailable: true
            },
            // Pasta (pasta)
            {
                itemName: 'Spaghetti Carbonara',
                category: 'pasta',
                price: 145,
                description: 'Creamy pasta with bacon, eggs, and parmesan cheese.',
                quantity: 25,
                image: '/image/carbonara.jpg',
                isAvailable: true
            },
            // Coffee (coffee)
            {
                itemName: 'Iced Coffee',
                category: 'coffee',
                price: 55,
                description: 'Cold brew coffee served with ice and milk.',
                quantity: 50,
                image: '/image/icedcoffee.jpg',
                isAvailable: true
            }
        ];

        await InventoryItem.insertMany(sampleItems);
        console.log(`✓ Inventory seeded with ${sampleItems.length} test items`);
    } catch (error) {
        console.error('Error seeding inventory:', error.message);
    }
}

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));