import { validationResult } from 'express-validator';
import Order from '../../../shared/models/Order.js';
import Product from '../../../shared/models/Product.js';

import { generateUniqueOrderId } from '../../../shared/utils/generateUniqueNumber.js';
import { NewUserOrderMessage } from '../../../mails/Orders/NewOrder.message.js';
import { sendOrderTelegram } from './send.order.telegram.js';

// Create order
export const create = async (req, res) => {
    try {
        // Валідація даних
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { cartProducts, delivery, ...other } = req.body;

        // Перевірка наявності необхідних даних
        if (!cartProducts || cartProducts.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid cart data' });
        }

        // Пошук продуктів
        const productIds = cartProducts.map((item) => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        if (products.length !== cartProducts.length) {
            return res.status(404).json({ success: false, message: 'Some products not found' });
        }

        // Обчислення даних замовлення
        const productsData = cartProducts
            .map((cartItem) => {
                const product = products.find((p) => p._id.toString() === cartItem.productId);
                if (!product) return null;

                const qty = cartItem.qty || 1;
                const total = product.price * qty;

                return {
                    product: product._id,
                    qty,
                    price: product.price,
                    total,
                };
            })
            .filter(Boolean);

        const totalCost = productsData.reduce((sum, item) => sum + item.total, 0);

        // Дані доставки
        const statusHistory = [{ status: 'Pending', date: new Date() }];

        // Створення замовлення
        const order = new Order({
            orderId: await generateUniqueOrderId(Order),
            productsData,
            totalCost,
            statusHistory,
            delivery: {
                title: delivery,
            },
            ...other,
        });

        await order.save();

        console.log('order', order);

        // Відправляємо лист на пошту користувача, про успішне створення замовлення, та додаємо деталі про замовлення.
        NewUserOrderMessage(order).catch((err) => {
            console.error('Error sending user order email:', err);
        });
        sendOrderTelegram(order).catch((err) => {
            console.error('Error sending order to Telegram:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId: order.orderId,
            userEmail: other.shipping.email,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export const updatePaymentsLanding = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;

        const { ...orderData } = req.body;

        await Order.updateOne({ _id: ORDER_PAGE_ID }, orderData);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
