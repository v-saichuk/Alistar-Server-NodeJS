import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as InformationController from '../controllers/information/information.controller.js';

const router = Router();

router.get('/api/admin/information', checkAuth, InformationController.getAll);

export default router;
