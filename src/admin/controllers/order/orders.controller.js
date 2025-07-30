import { validationResult } from 'express-validator';
import Order from '../../../shared/models/Order.js';
import Product from '../../../shared/models/Product.js';

import { generateUniqueOrderId } from '../../../shared/utils/generateUniqueNumber.js';

// Get all orders
export const getAll = async (req, res) => {
    try {
        const orders = await Order.find().populate('productsData.product');
        res.json(orders.reverse());
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

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
// await sendOrderTelegram({});
// Update order
export const update = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;

        const { ...orderData } = req.body;

        await Order.updateOne({ _id: ORDER_PAGE_ID }, orderData);

        const ORDER = await Order.findById(ORDER_PAGE_ID).populate('productsData.product');

        res.json({ success: true, data: ORDER });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// Remove order
export const remove = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(ORDER_PAGE_ID);

        if (!deletedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Заявку не знайдено!',
            });
        }

        res.json({
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

// Update order status
export const updateStatus = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;
        const { status } = req.body;
        await Order.updateOne({ _id: ORDER_PAGE_ID }, { status });
        res.json({
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

// Update group of orders
export const groupUpdate = async (req, res) => {
    try {
        const ORDER_ID = req.body.orderId;
        switch (req.body.action) {
            case 'Duplicate':
                const filterIds = [];

                for (const OrderId of ORDER_ID) {
                    const order = await Order.findById(OrderId);

                    const doc = new Order({
                        ...order.toObject(),
                        first_name: order.first_name + ' (copy)',
                        _id: undefined,
                    });

                    await doc.save();
                    filterIds.push(OrderId);
                }

                const orders = await Order.find();
                res.json({ success: true, data: orders.reverse() });
                break;

            case 'Delete':
                await Order.deleteMany({ _id: { $in: ORDER_ID } });
                res.json({ success: true });
                break;

            default:
                break;
        }
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};
