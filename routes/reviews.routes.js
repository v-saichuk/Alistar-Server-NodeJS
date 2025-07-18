import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as ReviewsController from '../controllers/reviews/reviews.controller.js';

const router = Router();

router.get('/api/reviews/:page/:pageSize', checkAuth, ReviewsController.getAll);
router.get('/api/reviews/:productId', ReviewsController.getProductToClient);
router.post('/api/reviews', checkAuth, ReviewsController.create);
router.patch('/api/reviews/:reviewsId/', checkAuth, ReviewsController.update);
router.delete('/api/reviews/:reviewsId/', checkAuth, ReviewsController.remove);

export default router;
