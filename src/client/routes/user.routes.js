import { Router } from 'express';
import * as UserController from '../controllers/user/user.controller.js';

const router = Router();

router.post('/api/user/update/address', UserController.updateUserClient);

export default router;
