const { CustomError } = require('../utils/errors');

module.exports = (app) => {
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);

      if (err instanceof CustomError) {
        return res.status(err.statusCode).json({ 
          error: err.message,
          message: err.message 
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
      });
    });
    
    // Handle 404s
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
      });
    });
};