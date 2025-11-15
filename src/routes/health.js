const express = require('express');
const router = express.Router();

/**
 * @route GET /api/health
 * @description Check API health
 * @access Public
 */
router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;
