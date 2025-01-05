const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/dbClient');
const redisClient = require('../utils/redisClient');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

if (!fs.existsSync(FOLDER_PATH)) {
  fs.mkdirSync(FOLDER_PATH);
}

class FilesController {
  // File Upload 
  static async postUpload(req, res) {
    const { name, type, data, parentId, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentFile = parentId ? await dbClient.findFile(parentId) : null;

    if (parentId && (!parentFile || parentFile.type !== 'folder')) {
      return res.status(400).json({ error: 'Parent not found or not a folder' });
    }

    const fileData = {
      userId,
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
    };

    if (type !== 'folder') {
      const filePath = path.join(FOLDER_PATH, uuidv4());
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      fileData.localPath = filePath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileData);

    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic: fileData.isPublic,
      parentId: fileData.parentId,
    });
  }

  // Get File by ID 
  static async getShow(req, res) {
    const { id } = req.params;

    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.findFile(id);

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.userId !== userId && !file.isPublic) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  // List Files 
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const files = await dbClient.db
      .collection('files')
      .find({ parentId, userId })
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();

    return res.status(200).json(files);
  }

  // Publish File
  static async putPublish(req, res) {
    const { id } = req.params;

    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.findFile(id);

    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: file._id },
      { $set: { isPublic: true } }
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  //Unpublish File
  static async putUnpublish(req, res) {
    const { id } = req.params;

    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.findFile(id);

    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: file._id },
      { $set: { isPublic: false } }
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }
}

module.exports = FilesController;
