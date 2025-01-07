import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        this.client.on('error', (err) => {
            console.error(`Redis client error: ${err}`);
        });

        this.client.on('connect', () => {
            console.log('Redis client connected');
        });

        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        try {
            return await this.getAsync(key);
        } catch (err) {
            console.error(`Error getting key ${key}: ${err}`);
            return null;
        }
    }

    async set(key, value, duration) {
        try {
            await this.setAsync(key, value);
            this.client.expire(key, duration);
        } catch (err) {
            console.error(`Error setting key ${key}: ${err}`);
        }
    }

    async del(key) {
        try {
            return await this.delAsync(key);
        } catch (err) {
            console.error(`Error deleting key ${key}: ${err}`);
            return null;
        }
    }
}

const redisClient = new RedisClient();
export default redisClient;
