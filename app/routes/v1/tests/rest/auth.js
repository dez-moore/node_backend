var request = require('supertest');
var express = require('express');
var should = require('should');
var app = (exports.app = express());

before(function (done) {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    require('../../controllers/auth')(app);

    done();
});

describe('Auth Controller', function () {
    describe('POST: /api/auth', function () {
        it('should return unauthorized', function (done) {
            var creds = {
                username: 'someUser',
                password: 'somePassword',
            };
            request(app).post('/api/auth').send(creds).expect(401, done);
        });
    });
});
