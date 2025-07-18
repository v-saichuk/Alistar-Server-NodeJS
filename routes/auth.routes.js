import { Router } from 'express';
import * as AuthController from '../controllers/auth/auth.controller.js';
import * as AuthValidation from '../validators/auth.validation.js';

const router = Router();

router.post('/api/auth/login', AuthValidation.login, AuthController.Login);
router.post('/api/auth/register', AuthValidation.forgotPassword, AuthController.Register);
router.post('/api/auth/forgot-password', AuthValidation.forgotPassword, AuthController.ForgotPassword);
router.post('/api/auth/google', AuthController.LoginWithGoogle);

export default router;
