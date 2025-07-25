import { Router } from 'express';
import checkAuth from '../utils/checkAuth.js';
import * as OrderController from '../controllers/order/orders.controller.js';
import * as OrderStatusController from '../controllers/order/orders.status.controller.js';

const router = Router();

router.get('/api/orders', OrderController.getAll);
router.post('/api/order', OrderController.create);
router.patch('/api/order/:id', checkAuth, OrderController.update);
router.patch('/api/order/payments/:id', OrderController.updatePaymentsLanding);
router.delete('/api/order/:id', checkAuth, OrderController.remove);
router.patch('/api/order/status/:id', checkAuth, OrderController.updateStatus);
router.patch('/api/order/group/update', checkAuth, OrderController.groupUpdate);

// === CLIENT ===
router.get('/api/user/orders/:userId', OrderController.getUserOrdersAll);
router.get('/api/user/order/:userId/:orderId', OrderController.getUserOrderById);
router.get('/api/user/invoice/:id', OrderController.getByIdInvoice);
// === ./CLIENT ===

// === STATUS ===
router.get('/api/order/status', checkAuth, OrderStatusController.getAll);
router.post('/api/order/status', checkAuth, OrderStatusController.create);
router.patch('/api/order/status/patch/:id', checkAuth, OrderStatusController.update);
router.delete('/api/order/status/:id', checkAuth, OrderStatusController.remove);
// === ./STATUS ===

export default router;
