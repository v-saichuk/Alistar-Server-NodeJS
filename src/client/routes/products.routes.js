import { Router } from 'express';
import * as ProductControllerClient from '../controllers/products/products.controller.js';

const router = Router();

// Client
router.get('/api/products/search/:lang/:text', ProductControllerClient.getSearch);
router.get('/api/get-products/:categorySlug/:subCategorySlug/:subSubCategorySlug?', ProductControllerClient.getAllProducts); // додати ? — робить параметр необов'язковим
router.get('/api/get-filters', ProductControllerClient.getFilters); // Отримуємо фільтри з потрібної категорії
router.get('/api/client/product/:slug', ProductControllerClient.clientGetOne);
router.post('/api/product/slug-by-lang', ProductControllerClient.getSlugByLang); // При зміні мови на клієнті, отримуємо новий slug для товару

export default router;
