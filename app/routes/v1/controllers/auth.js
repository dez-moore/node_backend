var Passport = require('../modules/auth/passport');

module.exports = function (app) {
    var passport = new Passport();

    app.post('/api/auth', passport.authenticate('local'), function (req, res) {
        res.json({ message: 'sucess login' });
    });
};
