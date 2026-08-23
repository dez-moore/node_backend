module.exports = function (app) {
    app.get('/', function (req, res) {
        res.redirect('/v1/api');
    });

    app.get('/api', function (req, res) {
        res.json({ message: 'API IS UP, Version 1' });
    });
};
