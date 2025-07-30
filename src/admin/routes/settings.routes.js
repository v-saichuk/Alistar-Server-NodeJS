import { Router } from 'express';
import * as SettingsController from '../controllers/settings/settings.controller.js';

const router = Router();

router.get('/api/settings/email', SettingsController.getAll);
router.post('/api/settings/email', SettingsController.update);

export default router;
