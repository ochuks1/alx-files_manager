import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import fs from 'fs';
import path from 'path';
import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, isPublic = false, parentId = 0, data } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentFile = parentId && (await dbClient.collection('files').findOne({ _id: ObjectId(parentId) }));
    if (parentId !== 0 && !parentFile) {
      return res.status(400).json({ error: 'Parent not found' });
    }
    if (parentFile && parentFile.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDocument = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      const result = await dbClient.collection('files').insertOne(fileDocument);
      return res.status(201).json({ id: result.insertedId, ...fileDocument });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    fileDocument.localPath = localPath;

    const result = await dbClient.collection('files').insertOne(fileDocument);
    return res.status(201).json({ id: result.insertedId, ...fileDocument });
  }

static async getShow(req, res) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const file = await dbClient.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
  if (!file) return res.status(404).json({ error: 'Not found' });

  res.json(file);
}

static async getIndex(req, res) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { parentId = 0, page = 0 } = req.query;
  const query = { userId: ObjectId(userId), parentId };

  const files = await dbClient
    .collection('files')
    .aggregate([
      { $match: query },
      { $skip: parseInt(page, 10) * 20 },
      { $limit: 20 },
    ])
    .toArray();

  res.json(files);
 }
 // Creating the Bull queue
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

async function postFile(req, res) {
  // Existing logic to save file locally and in the database...
  const { userId, fileId, filePath, fileType } = savedFileDetails;

  if (fileType === 'image') {
    // Add job to the queue
    fileQueue.add({
      userId,
      fileId,
      filePath,
    });
  }

  return res.status(201).json(savedFileDetails);
 }
 async function getFile(req, res) {
  const { id } = req.params;
  const size = req.query.size;

  try {
    // Find the file in the database
    const fileDocument = await dbClient.findFileById(id);
    if (!fileDocument) return res.status(404).json({ error: 'File not found' });

    const filePath = fileDocument.localPath;
    let fileToServe = filePath;

    if (size) {
      fileToServe = `${filePath}_${size}`;
      if (!fs.existsSync(fileToServe)) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    return res.sendFile(fileToServe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
 }
}

export default FilesController;
