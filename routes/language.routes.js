import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as LanguageController from '../controllers/language/language.controller.js';
import * as LanguageValidation from '../validators/language.validation.js';

const router = Router();

router.get('/api/language', LanguageController.getAll);
router.post('/api/language', checkAuth, LanguageValidation.create, LanguageController.create);
router.patch('/api/language/:id', checkAuth, LanguageController.update);
router.delete('/api/language/:id', checkAuth, LanguageValidation.remove, LanguageController.remove);

export default router;
