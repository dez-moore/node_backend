var User = require('../../models/User');
var userService = require('../../services/user');
var should = require('should');

describe('User Service', function () {
    before(async function () {
        // Ensure this suite's exact-count assertions aren't affected by data
        // left behind by other test files sharing the same in-memory database.
        await User.deleteMany({});

        var seedUsers = [
            {
                username: 'user1',
                firstName: 'aaa',
                lastName: 'bbb',
                jobTitle: 'teacher',
                city: 'Chicago',
                state: 'IL',
                active: true,
                password: 'password1',
            },
            {
                username: 'user2',
                firstName: 'bbb',
                lastName: 'bbb',
                jobTitle: 'teacher',
                city: 'Houston',
                state: 'TX',
                active: true,
                password: 'password1',
            },
            {
                username: 'user3',
                firstName: 'aaa',
                lastName: 'ccc',
                jobTitle: 'engineer',
                city: 'Dallas',
                state: 'TX',
                active: true,
                password: 'password1',
            },
            {
                username: 'user4',
                firstName: 'ddd',
                lastName: 'ccc',
                jobTitle: 'engineer',
                city: 'Los Angeles',
                state: 'CA',
                active: false,
                password: 'password1',
            },
            {
                username: 'user5',
                firstName: 'aaa',
                lastName: 'ddd',
                jobTitle: 'officer',
                city: 'Dallas',
                state: 'TX',
                active: false,
                password: 'password1',
            },
            {
                username: 'user6',
                firstName: 'aaa',
                lastName: 'ccc',
                jobTitle: 'officer',
                city: 'New York',
                state: 'NY',
                active: false,
                password: 'password1',
            },
            {
                username: 'user7',
                firstName: 'ddd',
                lastName: 'ccc',
                jobTitle: 'teacher',
                city: 'New York',
                state: 'NY',
                active: true,
                password: 'password1',
            },
        ];

        await Promise.all(
            seedUsers.map(function (data) {
                return new User(data).save();
            }),
        );
    });

    describe('Get Users', function () {
        it('should get all user in db', async function () {
            var users = await userService.getUsers({});
            should.exist(users);
            users.length.should.equal(7);
        });
        it('should filter by active status', async function () {
            var users = await userService.getUsers({ status: 'active' });
            should.exist(users);
            users.length.should.equal(4);
        });
        it('should filter by inactive status', async function () {
            var users = await userService.getUsers({ status: 'inactive' });
            should.exist(users);
            users.length.should.equal(3);
        });
        it('should group all by city', async function () {
            var users = await userService.getUsers({ group: 'city' });
            should.exist(users);
            users['Chicago'].length.should.equal(1);
            users['Houston'].length.should.equal(1);
            users['Dallas'].length.should.equal(2);
            users['Los Angeles'].length.should.equal(1);
            users['New York'].length.should.equal(2);
        });
        it('should group all by state', async function () {
            var users = await userService.getUsers({ group: 'state' });
            should.exist(users);
            users['IL'].length.should.equal(1);
            users['TX'].length.should.equal(3);
            users['CA'].length.should.equal(1);
            users['NY'].length.should.equal(2);
        });
        it('should group by jobTitle', async function () {
            var users = await userService.getUsers({ group: 'jobTitle' });
            should.exist(users);
            users['teacher'].length.should.equal(3);
            users['engineer'].length.should.equal(2);
            users['officer'].length.should.equal(2);
        });
        it('should group by firstName', async function () {
            var users = await userService.getUsers({ group: 'firstName' });
            should.exist(users);
            users['aaa'].length.should.equal(4);
            users['bbb'].length.should.equal(1);
            users['ddd'].length.should.equal(2);
        });
        it('should group by lastName', async function () {
            var users = await userService.getUsers({ group: 'lastName' });
            should.exist(users);
            users['bbb'].length.should.equal(2);
            users['ccc'].length.should.equal(4);
            users['ddd'].length.should.equal(1);
        });
        it('should sort by active and group by city', async function () {
            var users = await userService.getUsers({ status: 'active', group: 'city' });
            should.exist(users);
            users['Chicago'].length.should.equal(1);
            users['Houston'].length.should.equal(1);
            users['Dallas'].length.should.equal(1);
            users['New York'].length.should.equal(1);
            users.should.not.have.property('Los Angeles');
        });
        it('should sort by inactive and group by city', async function () {
            var users = await userService.getUsers({ status: 'inactive', group: 'city' });
            should.exist(users);
            users['Los Angeles'].length.should.equal(1);
            users['Dallas'].length.should.equal(1);
            users['New York'].length.should.equal(1);
            users.should.not.have.property('Chicago');
        });
        it('should send err when invalid status param', async function () {
            var err;
            try {
                await userService.getUsers({ status: 'live' });
            } catch (e) {
                err = e;
            }
            should.exist(err);
        });
        it('should send err when invalid group param', async function () {
            var err;
            try {
                await userService.getUsers({ group: 'password' });
            } catch (e) {
                err = e;
            }
            should.exist(err);
        });
        it('should paginate results', async function () {
            var page1 = await userService.getUsers({ page: '1', size: '3' });
            page1.length.should.equal(3);

            var page3 = await userService.getUsers({ page: '3', size: '3' });
            page3.length.should.equal(1);
        });
        it('should err on invalid pagination params', async function () {
            var err;
            try {
                await userService.getUsers({ page: '0', size: '3' });
            } catch (e) {
                err = e;
            }
            should.exist(err);
        });
    });

    describe('Create User', function () {
        it('should create user', async function () {
            var user = {
                username: 'user8',
                firstName: 'aaa',
                lastName: 'ccc',
                jobTitle: 'officer',
                city: 'New York',
                state: 'NY',
                active: true,
                password: 'password1',
            };
            var result = await userService.createUser(user);
            should.exist(result);
            var created = await User.findOne({ username: user.username });
            should.exist(created);
        });
        it('should send err when trying to create a user with an in use username', async function () {
            var user = {
                username: 'user8',
                firstName: 'aaa',
                lastName: 'ccc',
                jobTitle: 'officer',
                city: 'New York',
                state: 'NY',
                active: true,
                password: 'password1',
            };
            var err;
            try {
                await userService.createUser(user);
            } catch (e) {
                err = e;
            }
            should.exist(err);
        });
    });

    describe('Update User', function () {
        it('should update user', async function () {
            var username = 'user8';
            var changeValues = {
                firstName: 'new',
                lastName: 'name',
            };
            var result = await userService.updateUser(username, changeValues);
            should.exist(result);
            var updatedUser = await User.findOne({ username: username });
            should.exist(updatedUser);
            updatedUser.firstName.should.equal(changeValues.firstName);
            updatedUser.lastName.should.equal(changeValues.lastName);
        });
        it('should return err when user does not exist', async function () {
            var err;
            try {
                await userService.updateUser('user10', { firstName: 'new' });
            } catch (e) {
                err = e;
            }
            should.exist(err);
        });
    });

    describe('Delete User', function () {
        it('should delete user', async function () {
            var username = 'user8';
            var result = await userService.deleteUser(username);
            should.exist(result);
            var deletedUser = await User.findOne({ username: username });
            should.not.exist(deletedUser);
        });
    });
});
