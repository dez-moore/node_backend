var should = require('should');
var joiToSwagger = require('joi-to-swagger');
var swaggerDocument = require('../../../../../swagger.json');
var validation = require('../../validation/user');

// Guards against the validation/user.ts Joi schemas silently drifting from
// swagger.json's request-body definitions (which are hand-maintained since
// swagger.json is Swagger 2.0, not generated from Joi).
function schemaShape(schema) {
    var converted = joiToSwagger(schema).swagger;
    return {
        properties: converted.properties,
        required: converted.required || [],
    };
}

describe('Joi <-> swagger.json contract', function () {
    it('CreateUserRequest matches createUserSchema', function () {
        var expected = schemaShape(validation.createUserSchema);
        var actual = swaggerDocument.definitions.CreateUserRequest;

        actual.properties.should.eql(expected.properties);
        (actual.required || []).should.eql(expected.required);
    });

    it('UpdateUserRequest matches updateUserSchema', function () {
        var expected = schemaShape(validation.updateUserSchema);
        var actual = swaggerDocument.definitions.UpdateUserRequest;

        actual.properties.should.eql(expected.properties);
        (actual.required || []).should.eql(expected.required);
    });
});
