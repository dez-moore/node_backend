import type { Request, Response, NextFunction } from 'express';

const anonymousPaths = ['/', '/api', '/api/auth'];

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    // Check if user is logged in or allowed unauthenticated path
    if (req.isAuthenticated() || anonymousPaths.includes(req.path)) {
        return next();
    } else {
        return res.status(401).json({ message: 'Not Authenticated' });
    }
}
