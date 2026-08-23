# node_backend

Project to create a RESTful backend using Node, Express and MongoDB

## RUN

Copy `.env.example` to `.env` and fill in `SESSION_SECRET` (and any other values you need to override), then:

npm run start

## Test

npm run test

## API ENDPOINTS

version 1: /v1/

> Need to authenticate first to use endpoints. Any user in the DB can be authenticated. Vagrant provisionig should populate DB with sample users.

> User to authenticate with POST: '/v1/api/auth'

```
{
  "username": "admin",
  "password": "abc123"
}
```

> all other sample user passwords are 'password'

### Base

```javscript
GET '/v1/'
Response: {message: "API IS UP, Version {#}}, CODE: 200
```

```javscript
GET '/v1/api'
Response: {message: "API IS UP, Version {#}}, CODE: 200
```

### Auth

```javascript
POST /v1/api/auth
Request: {username: "user", password: "abc"}
Success: {message: "sucess"), Code: 200
Faiure: {unauthorized}, Code: 401
```

### User

##### Get Users

```javascript
GET /v1/api/users?status={active||inactive}&group={firstName||secondName||jobTitle||city||state}&page={n}&size={n}
Success no query: [
    {
        "_id": "560776b636afad41124e2655",
        "password": "$2a$10$LI34yFxGpw6AdErV2Kj/tOgDbB35NXCiYYjg8FdBbkSn6CMzLfHi6",
        "active": true,
        "state": "NY",
        "city": "New York",
        "lastName": "smith",
        "firstName": "john",
        "username": "jsmith",
        "__v": 0
  },
  { ..}
]
Success query: {
  "NY": [
    {
      "_id": "5607766b36afad41124e2654",
      "password": "$2a$10$BMcgNqiOpgsihZnSmE.Aj.w.e98NJ9HY2DlYora.gX/knF1YJkBcy",
      "active": true,
      "state": "NY",
      "city": "New York",
      "lastName": "account",
      "firstName": "admin",
      "username": "admin",
      "__v": 0
    },
  ], [...]
  "IL": [
    {
      "_id": "560776f936afad41124e2656",
      "password": "$2a$10$tikO8nyA7xAHZWGR5TtCte0JzJqodzVP7qdopSonxvM2Mp9jkGage",
      "active": true,
      "state": "IL",
      "city": "Chicago",
      "lastName": "smith",
      "firstName": "tim",
      "username": "tsmith",
      "__v": 0
    }
  ], [...]
}, CODE: 200
Failure: {"message": "Entered invalid status value. Use 'active' or 'inactive'. "}, {"message": "Invalid status params"}, CODE: 400
```

##### Create User

```javascript
POST /v1/api/user
REQUEST: { "username": "jsmith", "firstName": "john", "lastName": "smith", "jobTitle": "Engineer", "city": "New York", "state": "NY", "active": true, "password": "password1" }
Success: { "message": "User Created" }, CODE: 200
Failure: { "message": "{field} is required" }, { "message": "Username exist!" }, CODE: 400
```

##### Update User

```javascript
PUT /v1/api/user/:username
REQUEST: {"firstName": "john", "lastName": "smith", "jobTitle": "Engineer", "city": "New York", "state": "NY", "active": true, "password": "password1" } - none required
Success: { "message": "{username} has been created" }, CODE: 200
Failure: { "message": "No User Found" }, CODE: 400
```

##### Delete User

```javascript
DELETE /api/user/delete/:username
Success: { "message": "{username} has been removed" }, CODE: 200
Failure: { "message": "No User Found" }, CODE: 400
```

## Todo

1. Expand REST testing

2. Grunt

## Versioning

- versioning is handled through express routes
- starting with base '/v1'
- new changes that break existing functionality in current version will need a new version/route
- controllers/services/middleware/test will be placed in a new route/folder '/v{n}'
- a new {verision}.js file will be added to routes folder to handle routes and any needed middleware for the new version
- if any new feature require changes to database structure. Refactoring will be needed to decouple DB to allow each version to point to its own DB.
- Possible refactoring app to use restify https://github.com/restify/node-restify
