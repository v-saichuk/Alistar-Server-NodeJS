import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as ProductAvailability from '../controllers/products/products.availability.controller.js';

const router = Router();

router.get('/api/product/availability', checkAuth, ProductAvailability.getAll);
router.post('/api/product/availability/create', checkAuth, ProductAvailability.create);
router.post('/api/product/availability', checkAuth, ProductAvailability.update);

export default router;
