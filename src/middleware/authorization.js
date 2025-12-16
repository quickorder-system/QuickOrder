module.exports = (roles) => {
    return (req, res, next) => {
        console.log('[Authorization] Checking role - User role:', req.user?.role, 'Required roles:', roles);
        if (!roles.includes(req.user.role)) {
            console.log('[Authorization] Access denied - User role not in allowed roles');
            return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions' });
        }
        console.log('[Authorization] Access granted');
        next();
    };
};