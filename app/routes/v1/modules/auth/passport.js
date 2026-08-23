var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../../models/User');

module.exports = function () {
    passport.use(
        new LocalStrategy(async function (username, password, done) {
            try {
                var user = await User.findOne({ username: username });
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                var isMatch = await user.validPassword(password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            } catch (err) {
                return done(err);
            }
        }),
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(async function (id, done) {
        try {
            var user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    return passport;
};
