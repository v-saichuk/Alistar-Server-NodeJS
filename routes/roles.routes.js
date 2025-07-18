import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as RolesController from '../controllers/roles/roles.controller.js';
// import * as RolesValidation from '../validators/roles.validation.js'

const router = Router();

router.get('/api/roles', checkAuth, RolesController.getAll);
router.post('/api/roles', checkAuth, RolesController.create);
router.patch('/api/roles/:id', checkAuth, RolesController.update);
router.delete('/api/roles/:id', checkAuth, RolesController.remove);

export default router;
