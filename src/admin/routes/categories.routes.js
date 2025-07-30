import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as CategoriesController from '../controllers/categories/categories.controller.js';
import * as SubCategoriesController from '../controllers/categories/subCategories.controller.js';
import * as SubSubCategoriesController from '../controllers/categories/subSubCategories.controller.js';
import * as CategoriesHelpers from '../helpers/updateAllSlugsForAllLevels.js';

const router = Router();

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

// Оновлює slug-и для всіх категорій, підкатегорій та підпідкатегорій
router.post('/api/categories/update-all-slugs', CategoriesHelpers.updateAllSlugsForAllLevels);

export default router;
