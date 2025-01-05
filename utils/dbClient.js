const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client.connect().then(() => {
      this.db = this.client.db(dbName);
      console.log('MongoDB connected');
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  async findUser(email) {
    return this.db.collection('users').findOne({ email });
  }

  async findFile(id) {
    return this.db.collection('files').findOne({ _id: id });
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
