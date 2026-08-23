//Version 1
var express = require('express');
var session = require('express-session');
var helmet = require('helmet');
var cors = require('cors');
var rateLimit = require('express-rate-limit');
var app = (module.exports = express());
var guid = require('uuid').v1;
var passport = require('./v1/modules/auth/passport')();
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('../../swagger.json');

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
}

app.use(helmet());

var corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(function (origin) {
        return origin.trim();
    })
    .filter(Boolean);
if (corsOrigins.length > 0) {
    app.use(cors({ origin: corsOrigins }));
}

//Setup passport
app.use(
    session({
        genid: function (req) {
            return guid(); // use UUIDs for session IDs
        },
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    }),
);
app.use(passport.initialize());
app.use(passport.session());

// Swagger docs are mounted before the auth middleware so they stay public
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to ensure user is authenticated
app.use(require('./v1/middleware/ensureAuthenticated').ensureAuthenticated);

var authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

require('./v1/controllers/index')(app);
require('./v1/controllers/user')(app);
require('./v1/controllers/auth')(app);

// Centralized error handler — services/controllers throw/next(err) with a
// message meant for the client; default to 400 to match this API's existing
// contract (validation and not-found errors were always reported as 400).
app.use(function (err, req, res, next) {
    var statusCode = err.statusCode || 400;
    res.status(statusCode).json({ message: err.message });
});
