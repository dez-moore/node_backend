import Joi from 'joi';

function requiredMessage(label: string) {
    return { 'any.required': label + ' is required', 'string.empty': label + ' is required' };
}

export const createUserSchema = Joi.object({
    username: Joi.string().required().messages(requiredMessage('Username')),
    firstName: Joi.string().required().messages(requiredMessage('First name')),
    lastName: Joi.string().required().messages(requiredMessage('Last name')),
    jobTitle: Joi.string().optional(),
    city: Joi.string().required().messages(requiredMessage('City')),
    state: Joi.string().required().messages(requiredMessage('State')),
    active: Joi.boolean().required().messages({ 'any.required': 'Active status is required' }),
    password: Joi.string().required().messages(requiredMessage('Password')),
});

// Same fields as createUserSchema but all optional, matching services/user.js's
// field-by-field updateUser — at least one field must be present to update.
export const updateUserSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    jobTitle: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    active: Joi.boolean(),
    password: Joi.string(),
})
    .min(1)
    .messages({ 'object.min': 'At least one field is required to update a user' });
