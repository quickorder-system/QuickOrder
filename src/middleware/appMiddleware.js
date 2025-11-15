const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

module.exports = (app) => {
    // Configure CORS with specific options
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5501,http://127.0.0.1:5501').split(',');

    const corsOptions = {
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept'],
        credentials: true // Allow credentials
    };

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Configure Helmet with necessary adjustments
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='",
                    "data:",
                    "blob:",
                    "'unsafe-eval'"
                ],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "http://localhost:5001"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        }
    }));

    // Parse JSON and URL-encoded bodies before any routes
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Serve static files first
    app.use(express.static(path.join(__dirname, '..', '..'))); // Serve root directory
    app.use('/public', express.static(path.join(__dirname, '..', '..', 'public')));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
    });
    app.use(limiter);

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

    // Alias /addOrder to /api/orders for backward compatibility
    app.post('/addOrder', (req, res) => {
        req.url = '/api/orders';
        app._router.handle(req, res);
    });

};