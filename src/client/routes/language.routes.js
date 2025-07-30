import { Router } from 'express';
import * as LanguageController from '../controllers/language/language.controller.js';

const router = Router();

router.get('/api/client/language', LanguageController.getAll);

export default router;
