import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
const express = require('express');
const FilesController = require('../controllers/FilesController');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe); 
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.post('/files', FilesController.postUpload);

module.exports = router;

export default router;
