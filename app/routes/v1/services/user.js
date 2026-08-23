var User = require('../models/User');

var groupByType = ['city', 'state', 'jobTitle', 'firstName', 'lastName'];

function groupBy(list, key) {
    return list.reduce(function (groups, item) {
        var groupKey = item[key];
        groups[groupKey] = groups[groupKey] || [];
        groups[groupKey].push(item);
        return groups;
    }, {});
}

function parsePagination(params) {
    if (!params.hasOwnProperty('page') && !params.hasOwnProperty('size')) {
        return null;
    }

    var page = parseInt(params.page, 10);
    var size = parseInt(params.size, 10);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1) {
        throw new Error(
            "Invalid pagination params. 'page' and 'size' must both be positive integers.",
        );
    }

    return { skip: (page - 1) * size, limit: size };
}

var getUsers = async function (params) {
    var toGroup = false;

    // Check for groupby
    if (params.hasOwnProperty('group')) {
        if (params.group != null && groupByType.includes(params.group)) {
            toGroup = true;
        } else {
            throw new Error('Invalid status params');
        }
    }

    var pagination = parsePagination(params);

    var users;
    if (!params.hasOwnProperty('status')) {
        // Return full list of users
        var query = User.find();
        if (pagination) {
            query = query.skip(pagination.skip).limit(pagination.limit);
        }
        users = await query;
    } else {
        // Return list filtered by active status
        users = await queryUsersByStatus(params, pagination);
    }

    return toGroup ? groupBy(users, params.group) : users;
};

var createUser = async function (user) {
    // Required-field validation happens at the controller boundary (Joi schema).
    var existingUser = await User.findOne({ username: user.username });
    if (existingUser) {
        throw new Error('Username exist!');
    }

    var newUser = new User();
    newUser.username = user.username;
    newUser.firstName = user.firstName;
    newUser.lastName = user.lastName;
    newUser.city = user.city;
    newUser.state = user.state;
    newUser.active = user.active;
    newUser.password = user.password;

    await newUser.save();
    return 'User Created';
};

var updateUser = async function (username, userData) {
    var user = await User.findOne({ username: username });

    if (!user) {
        throw new Error('No User Found');
    }

    if (userData.hasOwnProperty('firstName') && userData.firstName != null) {
        user.firstName = userData.firstName;
    }
    if (userData.hasOwnProperty('lastName') && userData.lastName != null) {
        user.lastName = userData.lastName;
    }
    if (userData.hasOwnProperty('city') && userData.city != null) {
        user.city = userData.city;
    }
    if (userData.hasOwnProperty('active') && userData.active != null) {
        user.active = userData.active;
    }
    if (userData.hasOwnProperty('password') && userData.password != null) {
        user.password = userData.password;
    }
    if (userData.hasOwnProperty('jobTitle') && userData.jobTitle != null) {
        user.jobTitle = userData.jobTitle;
    }
    if (userData.hasOwnProperty('state') && userData.state != null) {
        user.state = userData.state;
    }

    await user.save();
    return username + ' has been updated.';
};

var deleteUser = async function (username) {
    await User.deleteOne({ username: username });
    return username + ' has been removed';
};

var queryUsersByStatus = async function (params, pagination) {
    if (params.status == null) {
        throw new Error('Invalid status params');
    }

    var active;
    if (params.status == 'active') {
        active = true;
    } else if (params.status == 'inactive') {
        active = false;
    } else {
        throw new Error("Entered invalid status value. Use 'active' or 'inactive'. ");
    }

    var query = User.find({ active: active });
    if (pagination) {
        query = query.skip(pagination.skip).limit(pagination.limit);
    }
    var users = await query;

    if (users != null && users.length > 0) {
        return users;
    } else {
        return { message: 'No Users found with status ' + params.status };
    }
};

module.exports = {
    getUsers: getUsers,
    createUser: createUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
};
