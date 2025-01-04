const { expect } = require('chai');
const redisClient = require('../utils/redis');

describe('redisClient', () => {
  it('should be able to connect to Redis', async () => {
    const isAlive = redisClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should set and get a key', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });

  it('should expire a key after TTL', (done) => {
    redisClient.set('tempKey', 'tempValue', 1);
    setTimeout(async () => {
      const value = await redisClient.get('tempKey');
      expect(value).to.be.null;
      done();
    }, 2000);
  });
});
