var request = require('supertest');
var express = require('express');
var should = require('should');
var app = (exports.app = express());

before(function (done) {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    require('../../controllers/user')(app);

    // Matches the centralized error handler in app/routes/v1.js
    app.use(function (err, req, res, next) {
        var statusCode = err.statusCode || 400;
        res.status(statusCode).json({ message: err.message });
    });

    done();
});

describe('User Controller', function () {
    describe('Get: /api/users', function () {
        it('should return 200 when', function (done) {
            request(app).get('/api/users').expect('Content-Type', /json/).expect(200, done);
        });
    });
    describe('Get: /api/users?status=active', function () {
        it('should return 200', function (done) {
            request(app)
                .get('/api/users?status=active')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });
    describe('Get: /api/users?status=inactive', function () {
        it('should return 200', function (done) {
            request(app)
                .get('/api/users?status=inactive')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });
    describe('Get: /api/users?status=true', function () {
        it('should return 400, bad request', function (done) {
            request(app)
                .get('/api/users?status=true')
                .expect('Content-Type', /json/)
                .expect(400, done);
        });
    });
    describe('Get: /api/users?group=firstName', function () {
        it('should return 200', function (done) {
            request(app)
                .get('/api/users?status=inactive')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });
    describe('Get: /api/users?group=city', function () {
        it('should return 200', function (done) {
            request(app)
                .get('/api/users?group=city')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });
    describe('Get: /api/users?group=id', function () {
        it('should return 400, bad request', function (done) {
            request(app)
                .get('/api/users?group=id')
                .expect('Content-Type', /json/)
                .expect(400, done);
        });
    });
    describe('Get: /api/users?page=1&size=2', function () {
        it('should return 200 with a paginated slice', async function () {
            var res = await request(app).get('/api/users?page=1&size=2').expect(200);
            res.body.length.should.be.belowOrEqual(2);
        });
    });

    describe('Post: /api/user', function () {
        it('should return 400 when a required field is missing', async function () {
            var res = await request(app)
                .post('/api/user')
                .send({
                    username: 'vtest1',
                    firstName: 'a',
                    lastName: 'b',
                    city: 'c',
                    state: 'd',
                    active: true,
                })
                .expect(400);
            res.body.message.should.equal('Password is required');
        });

        it('should create a user then reject a duplicate username', async function () {
            var user = {
                username: 'vtest2',
                firstName: 'a',
                lastName: 'b',
                city: 'c',
                state: 'd',
                active: true,
                password: 'password1',
            };

            var createRes = await request(app).post('/api/user').send(user).expect(200);
            createRes.body.message.should.equal('User Created');

            var dupRes = await request(app).post('/api/user').send(user).expect(400);
            dupRes.body.message.should.equal('Username exist!');
        });
    });
});
