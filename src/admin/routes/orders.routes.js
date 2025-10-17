import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as OrderController from '../controllers/order/orders.controller.js';
import * as OrderStatusController from '../controllers/order/orders.status.controller.js';

const router = Router();

router.get('/api/admin/orders', OrderController.getAll); // отримати всі замовлення
router.get('/api/admin/orders/:orderNum', OrderController.getById); // отримати замовлення за номером
router.get('/api/admin/orders/new/count', checkAuth, OrderController.getNewCount); // кількість нових замовлень

router.post('/api/order', OrderController.create); // створити нове замовлення
router.patch('/api/order/:id', checkAuth, OrderController.update); // оновити замовлення
router.delete('/api/order/:id', checkAuth, OrderController.remove); // видалити замовлення
router.patch('/api/order/group/update', checkAuth, OrderController.groupUpdate); // групове оновлення замовлень

router.patch('/api/admin/orders/:id/visit', checkAuth, OrderController.markVisited); // позначити як переглянуте
router.patch('/api/admin/orders/:id/status', checkAuth, OrderController.updateStatus); // змінити стан (активний/неактивний) замовлення

// === ADMIN ORDERS ===
// router.post('/api/admin/orders', checkAuth, OrderController.create);              // створити нове замовлення
// router.patch('/api/admin/orders/:id', checkAuth, OrderController.update);         // оновити замовлення
// router.delete('/api/admin/orders/:id', checkAuth, OrderController.remove);        // видалити замовлення

// router.patch('/api/admin/orders/group', checkAuth, OrderController.groupUpdate);  // групове оновлення замовлень
// === ./ADMIN ORDERS ===

// === STATUS ===
router.get('/api/admin/order-status', checkAuth, OrderStatusController.getAll); // отримати всі статуси замовлень
router.get('/api/admin/order-status/:id', checkAuth, OrderStatusController.getById); // отримати статус за ID
router.post('/api/admin/order-status', checkAuth, OrderStatusController.create); // створити статус
router.patch('/api/admin/order-status/:id', checkAuth, OrderStatusController.update); // оновити дані статусу
router.delete('/api/admin/order-status/:id', checkAuth, OrderStatusController.remove); // видалити статус
// === ./STATUS ===

export default router;
