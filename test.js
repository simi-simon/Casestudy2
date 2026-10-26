const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

async function runTests() {
    console.log('Starting Test Suite for Employee App Backend Integration...\n');
    let mongoServer;
    let server;
    let app;
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`  ✓ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`  ✗ FAIL: ${testName}`);
            failed++;
        }
    }

    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        process.env.MONGODB_URI = uri;
        process.env.PORT = '3001'; // use 3001 during test to avoid port conflict

        // Require app after setting MONGODB_URI
        const appModule = require('./app');
        app = appModule.app || appModule;
        server = appModule.server;

        // Ensure mongoose connection is ready
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(uri);
        }

        console.log('--- 1. Testing POST /api/employeelist ---');
        // Test 1: Add employee with valid data
        const validEmp = {
            name: 'Alice Johnson',
            location: 'Bangalore',
            position: 'Software Engineer',
            salary: 75000
        };
        const resPost = await request(app)
            .post('/api/employeelist')
            .send(validEmp);

        assert(resPost.status === 201, 'POST /api/employeelist returns 201 Created');
        assert(resPost.body._id && resPost.body.name === 'Alice Johnson', 'POST response contains _id and correct name');
        assert(resPost.body.salary === 75000, 'POST response contains correct numeric salary');
        const createdId = resPost.body._id;

        // Test 2: Validation errors on missing fields
        const resMissingName = await request(app)
            .post('/api/employeelist')
            .send({ location: 'Kochi', position: 'HR', salary: 40000 });
        assert(resMissingName.status === 400, 'POST with missing name returns 400 Bad Request');

        const resMissingSalary = await request(app)
            .post('/api/employeelist')
            .send({ name: 'Bob', location: 'Kochi', position: 'HR' });
        assert(resMissingSalary.status === 400, 'POST with missing salary returns 400 Bad Request');

        const resInvalidSalary = await request(app)
            .post('/api/employeelist')
            .send({ name: 'Bob', location: 'Kochi', position: 'HR', salary: 'not-a-number' });
        assert(resInvalidSalary.status === 400, 'POST with invalid salary returns 400 Bad Request');

        console.log('\n--- 2. Testing GET /api/employeelist ---');
        const resGetAll = await request(app).get('/api/employeelist');
        assert(resGetAll.status === 200, 'GET /api/employeelist returns 200 OK');
        assert(Array.isArray(resGetAll.body) && resGetAll.body.length >= 1, 'GET returns array with at least 1 employee');

        console.log('\n--- 3. Testing GET /api/employeelist/:id ---');
        const resGetOne = await request(app).get(`/api/employeelist/${createdId}`);
        assert(resGetOne.status === 200, 'GET /api/employeelist/:id returns 200 OK for valid ID');
        assert(resGetOne.body._id === createdId, 'GET by ID returns matching employee _id');

        const resGetInvalidId = await request(app).get('/api/employeelist/invalid-id-123');
        assert(resGetInvalidId.status === 400, 'GET with invalid ObjectId format returns 400 Bad Request');

        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const resGetNotFound = await request(app).get(`/api/employeelist/${nonExistentId}`);
        assert(resGetNotFound.status === 404, 'GET with non-existent ID returns 404 Not Found');

        console.log('\n--- 4. Testing PUT /api/employeelist ---');
        // Test update via body _id (as Angular frontend calls it)
        const updateBody = {
            _id: createdId,
            name: 'Alice Johnson Updated',
            location: 'Bangalore Tech Park',
            position: 'Senior Software Engineer',
            salary: 95000
        };
        const resPut = await request(app)
            .put('/api/employeelist')
            .send(updateBody);

        assert(resPut.status === 200, 'PUT /api/employeelist with body _id returns 200 OK');
        assert(resPut.body.name === 'Alice Johnson Updated', 'PUT updates name successfully');
        assert(resPut.body.salary === 95000, 'PUT updates salary successfully');

        // Test update via URL param /api/employeelist/:id
        const resPutUrl = await request(app)
            .put(`/api/employeelist/${createdId}`)
            .send({ position: 'Lead Software Engineer' });
        assert(resPutUrl.status === 200, 'PUT /api/employeelist/:id returns 200 OK');
        assert(resPutUrl.body.position === 'Lead Software Engineer', 'PUT updates position successfully');

        // Test missing id
        const resPutMissingId = await request(app)
            .put('/api/employeelist')
            .send({ name: 'No ID' });
        assert(resPutMissingId.status === 400, 'PUT with missing _id returns 400 Bad Request');

        // Test non-existent id
        const resPutNotFound = await request(app)
            .put('/api/employeelist')
            .send({ _id: nonExistentId, name: 'Nobody' });
        assert(resPutNotFound.status === 404, 'PUT with non-existent ID returns 404 Not Found');

        console.log('\n--- 5. Testing DELETE /api/employeelist/:id ---');
        const resDelete = await request(app).delete(`/api/employeelist/${createdId}`);
        assert(resDelete.status === 200, 'DELETE /api/employeelist/:id returns 200 OK');

        const resCheckDeleted = await request(app).get(`/api/employeelist/${createdId}`);
        assert(resCheckDeleted.status === 404, 'GET after DELETE returns 404 Not Found');

        const resDeleteNotFound = await request(app).delete(`/api/employeelist/${nonExistentId}`);
        assert(resDeleteNotFound.status === 404, 'DELETE non-existent ID returns 404 Not Found');

        const resDeleteInvalidId = await request(app).delete('/api/employeelist/bad-id-xyz');
        assert(resDeleteInvalidId.status === 400, 'DELETE invalid ID format returns 400 Bad Request');

        console.log('\n--- 6. Testing Frontend Static Files & Catch-all Route ---');
        const resIndex = await request(app).get('/');
        assert(resIndex.status === 200, 'GET / serves HTML file');
        assert(resIndex.text.includes('<app-root></app-root>'), 'GET / response contains Angular app-root');

        const resStyles = await request(app).get('/styles.31d6cfe0d16ae931b73c.css');
        assert(resStyles.status === 200, 'GET /styles...css serves stylesheet');

        const resCatchAll = await request(app).get('/employees/edit/123');
        assert(resCatchAll.status === 200, 'Catch-all route /* serves index.html for client-side routing');
        assert(resCatchAll.text.includes('<app-root></app-root>'), 'Catch-all response contains Angular app-root');

    } catch (err) {
        console.error('Unexpected error during testing:', err);
        failed++;
    } finally {
        if (server && server.close) {
            await new Promise((resolve) => server.close(resolve));
        }
        if (mongoose.connection) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }

        console.log('\n========================================');
        console.log(`Test Results: ${passed} passed, ${failed} failed`);
        console.log('========================================\n');

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

runTests();
