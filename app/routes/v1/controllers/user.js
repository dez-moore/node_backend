var userService = require('../services/user');
var createUserSchema = require('../validation/user').createUserSchema;
var updateUserSchema = require('../validation/user').updateUserSchema;

module.exports = function (app) {
    // Express 5 forwards a rejected/thrown promise from an async handler to
    // the centralized error middleware automatically, so no try/catch here.
    app.get('/api/users', async function (req, res) {
        var users = await userService.getUsers(req.query);
        res.send(users);
    });

    app.post('/api/user', async function (req, res) {
        var { error } = createUserSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }

        var msg = await userService.createUser(req.body);
        res.json({ message: msg });
    });

    app.put('/api/user/:username', async function (req, res) {
        var username = req.params.username;

        var { error } = updateUserSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }

        var msg = await userService.updateUser(username, req.body);
        res.json({ message: msg });
    });

    app.delete('/api/user/delete/:username', async function (req, res) {
        var username = req.params.username;

        var msg = await userService.deleteUser(username);
        res.json({ message: msg });
    });
};
