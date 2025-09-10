import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as LanguageController from '../controllers/language/language.controller.js';
import * as LanguageValidation from '../../admin/validators/language.validation.js';

const router = Router();

router.get('/api/language', LanguageController.getAll);
router.get('/api/language/:id', LanguageController.getOne);
router.post('/api/language', checkAuth, LanguageController.create);
router.patch('/api/language/:id', checkAuth, LanguageController.update);
router.delete('/api/language/:id', checkAuth, LanguageValidation.remove, LanguageController.remove);

export default router;
