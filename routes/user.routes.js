import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as UserController from '../controllers/user/user.controller.js';
import * as UserValidation from '../validators/user.validation.js';

const router = Router();

router.get('/api/users/:page/:pageSize', checkAuth, UserController.getAllUsers);

router.get('/api/profile', checkAuth, UserController.getProfile);
router.get('/api/user/:id', checkAuth, UserController.getUser);
router.post('/api/user', checkAuth, UserValidation.create, UserController.create);
router.patch('/api/user/:id', checkAuth, UserValidation.update, UserController.update);
router.delete('/api/user/:id', checkAuth, UserController.remove);

// Client
router.post('/api/user/update/address', UserController.updateUserClient);

export default router;
