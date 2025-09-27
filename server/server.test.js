const request = require('supertest');
const app = require('./server'); // Assuming your express app is exported from server.js

describe('GET /', () => {
  it('should respond with a welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Invest & Earn Corp backend server is running!');
  });
});
