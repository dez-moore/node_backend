module.exports = {
    ensureAuthenticated: function (req, res, next) {
        var anonymousPaths = ['/', '/api', '/api/auth'];

        // Check if user is logged in or allowed unauthenticated path
        if (req.isAuthenticated() || anonymousPaths.includes(req.path)) {
            return next();
        } else {
            return res.status(401).json({ message: 'Not Authenticated' });
        }
    },
};
