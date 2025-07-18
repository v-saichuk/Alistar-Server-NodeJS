import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as ProductController from '../controllers/products/products.controller.js';
import * as ProductControllerClient from '../controllers/products/products.controller.client.js';
import * as ProductLanding from '../controllers/products/products.landing.controller.js';
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

router.post('/api/product/landing', ProductLanding.getProducts);
router.get('/api/products/search/:lang/:text', ProductLanding.getSearch);

// Client
// додати ? — робить параметр необов'язковим
router.get('/api/get-products/:categorySlug/:subCategorySlug/:subSubCategorySlug?', ProductControllerClient.getAllProducts);

// router.get('/api/get-products/:categorySlug/:subCategorySlug/', ProductControllerClient.getAllProducts); // Отримую 10 товарів на лендінг
// router.get('/api/get-products/:categorySlug/:subCategorySlug/:subSubCategorySlug', ProductControllerClient.getAllProducts); // Отримую 10 товарів на лендінг
router.get('/api/get-filters', ProductControllerClient.getFilters); // Отримуємо фільтри з потрібної категорії
router.get('/api/client/product/:slug', ProductControllerClient.clientGetOne);
router.post('/api/client/get/products/id', ProductControllerClient.getProductsByIds);
router.post('/api/product/slug-by-lang', ProductControllerClient.getSlugByLang); // При зміні мови на клієнті, отримуємо новий slug для товару

export default router;
