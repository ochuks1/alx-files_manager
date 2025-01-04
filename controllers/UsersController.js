import dbClient from '../utils/db.js';
import { createHash } from 'crypto';
import Queue from 'bull';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check for missing email
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check for missing password
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if user already exists
    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using SHA1
    const hashedPassword = createHash('sha1').update(password).digest('hex');

    // Insert the new user into the database
    const result = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    // Respond with the new user info
    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.getObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
    });
  }
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

async function postNew(req, res) {
  const { email, password } = req.body;

  // Existing user creation logic...
  const userId = newUser._id;

  // Add a job to the user queue
  userQueue.add({ userId });

  return res.status(201).json({ id: userId, email });
 }
}

export default UsersController;
