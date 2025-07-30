import { Router } from 'express';
import * as ReviewsController from '../controllers/reviews/reviews.controller.js';

const router = Router();

router.get('/api/client/reviews/:productId', ReviewsController.getProductToClient);

export default router;
