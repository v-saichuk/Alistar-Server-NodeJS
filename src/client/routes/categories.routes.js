import { Router } from 'express';
import * as CategoriesController from '../controllers/categories/categories.controller.js';

const router = Router();

router.get('/api/client/navigations', CategoriesController.clientGetNavigations);
router.get('/api/client/category/:slug', CategoriesController.clientGetCategory);
// При зміні мови на клієнті, отримуємо новий slug для категорії
router.post('/api/catalog/slug-by-lang', CategoriesController.getCategorySlugByLang);

export default router;
