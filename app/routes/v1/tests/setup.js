var mongoose = require('mongoose');
var MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;

var mongod;

exports.mochaHooks = {
    beforeAll: async function () {
        // First run may need to download the MongoDB binary.
        this.timeout(120000);
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
    },
    afterAll: async function () {
        await mongoose.connection.close();
        if (mongod) {
            await mongod.stop();
        }
    },
};
