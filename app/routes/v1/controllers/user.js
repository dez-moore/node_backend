var userService = require('../services/user');
var createUserSchema = require('../validation/user').createUserSchema;

module.exports = function (app) {
    app.get('/api/users', async function (req, res, next) {
        try {
            var users = await userService.getUsers(req.query);
            res.send(users);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/user', async function (req, res, next) {
        var { error } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            var msg = await userService.createUser(req.body);
            res.json({ message: msg });
        } catch (err) {
            next(err);
        }
    });

    app.put('/api/user/:username', async function (req, res, next) {
        var username = req.params.username;

        try {
            var msg = await userService.updateUser(username, req.body);
            res.json({ message: msg });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/user/delete/:username', async function (req, res, next) {
        var username = req.params.username;

        try {
            var msg = await userService.deleteUser(username);
            res.json({ message: msg });
        } catch (err) {
            next(err);
        }
    });
};
