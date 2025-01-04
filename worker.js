import Queue from 'bull';
import dbClient from './utils/db';
import fs from 'fs';
import path from 'path';
import imageThumbnail from 'image-thumbnail';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job) => {
  const { userId, fileId, filePath } = job.data;

  try {
    // Validate inputs
    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    // Find the file in the database
    const fileDocument = await dbClient.findFileByIdAndUser(fileId, userId);
    if (!fileDocument) throw new Error('File not found');

    // Generate thumbnails (100, 250, 500)
    const sizes = [100, 250, 500];
    for (const size of sizes) {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = `${filePath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }

    console.log(`Thumbnails created for file ${filePath}`);
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    throw error;
  }

userQueue.process(async (job) => {
  const { userId } = job.data;

  try {
    if (!userId) throw new Error('Missing userId');

    // Retrieve the user from the database
    const user = await dbClient.findUserById(userId);
    if (!user) throw new Error('User not found');

    console.log(`Welcome ${user.email}!`);
  } catch (error) {
    console.error(`Error processing user job: ${error.message}`);
  }
});
