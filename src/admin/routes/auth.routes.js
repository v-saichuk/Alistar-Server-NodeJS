import { Router } from 'express';
import * as AuthController from '../controllers/auth/auth.controller.js';
import * as AuthValidation from '../../admin/validators/auth.validation.js';

const router = Router();

router.post('/api/auth/login', AuthValidation.login, AuthController.Login);

export default router;
