var Joi = require('joi');

function requiredMessage(label) {
    return { 'any.required': label + ' is required', 'string.empty': label + ' is required' };
}

var createUserSchema = Joi.object({
    username: Joi.string().required().messages(requiredMessage('Username')),
    firstName: Joi.string().required().messages(requiredMessage('First name')),
    lastName: Joi.string().required().messages(requiredMessage('Last name')),
    jobTitle: Joi.string().optional(),
    city: Joi.string().required().messages(requiredMessage('City')),
    state: Joi.string().required().messages(requiredMessage('State')),
    active: Joi.boolean().required().messages({ 'any.required': 'Active status is required' }),
    password: Joi.string().required().messages(requiredMessage('Password')),
});

module.exports = {
    createUserSchema: createUserSchema,
};
