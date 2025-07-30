import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as ProductController from '../controllers/products/products.controller.js';
import * as ProductAvailability from '../controllers/products/products.availability.controller.js';

const router = Router();

router.post('/api/get-products', ProductController.apiGetProductsAdmin);
router.get('/api/product/one/:id', ProductController.getOne);
router.post('/api/product', checkAuth, ProductController.create);
router.patch('/api/product/:id', checkAuth, ProductController.update);
router.delete('/api/product/:id', checkAuth, ProductController.remove);
router.patch('/api/product/group/update', checkAuth, ProductController.groupUpdate);
router.patch('/api/product/duplicate/one', checkAuth, ProductController.duplicateProduct);
router.get('/api/parameters', ProductController.parameters);
router.get('/api/product/check-sku/:sku', ProductController.checkSkuExists);

router.get('/api/product/availability', checkAuth, ProductAvailability.getAvailability);
router.post('/api/product/availability', checkAuth, ProductAvailability.update);

export default router;
