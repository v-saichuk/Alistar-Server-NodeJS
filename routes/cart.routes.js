import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as CartController from '../controllers/cart/cart.controller.js';

const router = Router();

router.get('/api/cart', checkAuth, CartController.getAll);
router.post('/api/cart', checkAuth, CartController.create);
// router.patch('/api/categories/patch', checkAuth, CategoriesController.update);
// router.delete('/api/categories/:id', checkAuth, CategoriesController.remove);

export default router;
