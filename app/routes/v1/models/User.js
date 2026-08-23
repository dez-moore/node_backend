var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcryptjs');
var SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    jobTitle: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    active: { type: Boolean, required: true },
    password: { type: String, required: true },
});

UserSchema.pre('save', async function () {
    var user = this;

    // Check if password was changed
    if (!user.isModified('password')) {
        return;
    }

    var salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    user.password = await bcrypt.hash(user.password, salt);
});

UserSchema.methods.validPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
