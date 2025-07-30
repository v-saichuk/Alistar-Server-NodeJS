import { Router } from 'express';
import * as AuthController from '../controllers/auth/auth.controller.js';
import * as AuthValidation from '../../client/validators/auth.validation.js';

const router = Router();

router.post('/api/client/auth/login', AuthValidation.login, AuthController.Login);
router.post('/api/client/auth/register', AuthValidation.forgotPassword, AuthController.Register);
router.post('/api/client/auth/forgot-password', AuthValidation.forgotPassword, AuthController.ForgotPassword);
router.post('/api/client/auth/google', AuthController.LoginWithGoogle);

export default router;
