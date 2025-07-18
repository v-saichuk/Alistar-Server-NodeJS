import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as CategoriesController from '../controllers/categories/categories.controller.js';
import * as SubCategoriesController from '../controllers/categories/subCategories.controller.js';
import * as SubSubCategoriesController from '../controllers/categories/subSubCategories.controller.js';
import * as CategoriesHelpers from '../controllers/categories/helpers/updateAllSlugsForAllLevels.js';

const router = Router();

// Admin
router.get('/api/product/categories', CategoriesController.getAll);
router.post('/api/product/categories', checkAuth, CategoriesController.create);
router.patch('/api/categories/patch', checkAuth, CategoriesController.update);
router.delete('/api/categories/:id', checkAuth, CategoriesController.remove);

router.get('/api/sub-categories', SubCategoriesController.getAll);
router.post('/api/sub-categories', checkAuth, SubCategoriesController.create);
router.patch('/api/sub-categories/patch', checkAuth, SubCategoriesController.update);
router.delete('/api/sub-categories/:id', checkAuth, SubCategoriesController.remove);

router.get('/api/sub-sub-categories', SubSubCategoriesController.getAll);
router.post('/api/sub-sub-categories', checkAuth, SubSubCategoriesController.create);
router.patch('/api/sub-sub-categories/patch', checkAuth, SubSubCategoriesController.update);
router.delete('/api/sub-sub-categories/:id', checkAuth, SubSubCategoriesController.remove);

router.post('/api/categories/update-all-slugs', CategoriesHelpers.updateAllSlugsForAllLevels); // Оновлює slug-и для всіх категорій, підкатегорій та підпідкатегорій

// Client
router.get('/api/client/navigations', CategoriesController.clientGetNavigations);
router.get('/api/client/category/:slug', CategoriesController.clientGetCategory);
router.post('/api/catalog/slug-by-lang', CategoriesController.getCategorySlugByLang); // При зміні мови на клієнті, отримуємо новий slug для категорії

export default router;
