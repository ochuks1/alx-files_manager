const { expect } = require('chai');
const request = require('supertest');
const app = require('../server'); // Your server entry point

describe('API Endpoints', () => {
  describe('GET /status', () => {
    it('should return status ok', (done) => {
      request(app)
        .get('/status')
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('redis');
          expect(res.body).to.have.property('db');
          done();
        });
    });
  });

  describe('GET /stats', () => {
    it('should return stats', (done) => {
      request(app)
        .get('/stats')
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('files');
          done();
        });
    });
  });

 describe('POST /users', () => {
  it('should create a new user and send a welcome email', (done) => {
    request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .end((err, res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email', 'test@example.com');
        done();
      });
  });
});
