import { Router } from 'express';
import * as OrderController from '../controllers/orders/orders.controller.js';

const router = Router();

router.post('/api/client/order', OrderController.create);
router.patch('/api/client/order/payments/:id', OrderController.updatePaymentsLanding);

export default router;
