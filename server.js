//Setup Server
require('dotenv').config();

var express = require('express');
var mongoose = require('mongoose');
var pino = require('pino')();
var pinoHttp = require('pino-http')({ logger: pino });
var config = require('./config');

//Connect to DB
var connectionString = process.env.DATABASE_CONNECTION_STRING || config.mongoDB.connectionString;
mongoose.connect(connectionString + config.mongoDB.dbName);

var app = express();
const router = express.Router();

app.use(pinoHttp);

//Configure body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Set port
var port = process.env.PORT || config.port;

var VERSIONS = config.versions;

//Configure Routes
app.use('/', router);

//Version paths
for (var k in VERSIONS) {
    app.use(VERSIONS[k], require('./app/routes' + VERSIONS[k]));
}

//Return the version paths
app.get('/', function (req, res) {
    res.json(VERSIONS);
});

//Start Server
app.listen(port);

pino.info('Server Listening on port: ' + port);
