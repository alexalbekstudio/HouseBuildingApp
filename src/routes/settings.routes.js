import express from 'express';
import multer from 'multer';
import * as settingsController from '../controllers/settings.controller.js';

const upload = multer({ dest: 'temp/' });
const router = express.Router();

router.get('/api/settings', settingsController.getSettings);
router.post('/api/settings', upload.single('company_logo'), settingsController.saveSettings);
router.get('/company-logo.png', settingsController.serveLogo);
router.get('/favicon.ico', settingsController.serveFavicon);

export default router;