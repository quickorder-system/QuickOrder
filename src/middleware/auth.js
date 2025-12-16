const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header - support both 'x-auth-token' and 'Authorization: Bearer token'
    let token = req.header('x-auth-token');
    
    if (!token) {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7); // Remove 'Bearer ' prefix
        }
    }

    // Check if token exists
    if (!token) {
        console.log('[Auth] No token found in request headers');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        console.log('[Auth] Token verified - User ID:', req.user?.id, 'Role:', req.user?.role, 'Username:', req.user?.username);
        next();
    } catch (err) {
        console.log('[Auth] Token verification failed:', err.message);
        console.log('[Auth] Token being verified:', token.substring(0, 50) + '...');
        res.status(401).json({ message: 'Token is not valid' });
    }
};