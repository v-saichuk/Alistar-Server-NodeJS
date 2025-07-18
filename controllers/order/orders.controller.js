import { validationResult } from 'express-validator';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';

// import CryptoJS from 'crypto-js';
// import { SendMailNewOrder } from './order.send_mail.js';
import { generateUniqueOrderId } from '../../utils/generateUniqueNumber.js';
import { NewUserOrderMessage } from '../../mails/Orders/NewOrder.message.js';

// Get all orders
export const getAll = async (req, res) => {
    try {
        const orders = await Order.find().populate('productsData.product');
        res.json(orders.reverse());
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// Get all orders
export const getUserOrdersAll = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find(
            { user: userId },
            {
                _id: 1,
                totalCost: 1,
                createdAt: 1,
                status: 1,
            },
        ).populate('status', 'title color');

        res.json({
            success: true,
            data: orders.reverse(),
        });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// User order by ID (for client)
export const getUserOrderById = async (req, res) => {
    try {
        const { userId, orderId } = req.params;

        // Перевірка наявності користувача
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Пошук замовлення
        const order = await Order.findOne({ _id: orderId, user: userId }).populate('status', 'title color').populate({
            path: 'productsData.product',
            select: 'images name.US name.UA', // Вибираємо лише необхідні локалізації
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Обробка даних товарів
        const formattedProducts = order.productsData.map((productData) => {
            const product = productData.product || {};
            const productName = product.name?.US || product.name?.UA || 'Unnamed Product';
            const image = product.images?.[0] || '';
            return {
                _id: product._id,
                qty: productData.qty,
                price: productData.price,
                total: productData.total,
                productName, // Назва товару у потрібній локалізації
                image,
            };
        });

        res.json({
            success: true,
            data: {
                ...order.toObject(),
                productsData: formattedProducts, // Форматований список товарів
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// Get order by ID
export const getByIdInvoice = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;

        const order = await Order.findById(ORDER_PAGE_ID, {
            address: 1,
            productsData: 1,
            shipping: 1,
            totalCost: 1,
            user: 1,
            createdAt: 1,
            _id: 1,
        })
            .populate({
                path: 'productsData.product',
                select: 'name.US name.UA', // Вибираємо лише необхідні локалізації
            })
            .populate('user', 'email firstName lastName');

        // Обробка даних товарів
        const formattedProducts = order.productsData.map((productData) => {
            const product = productData.product || {};
            const productName = product.name?.US || product.name?.UA || 'Unnamed Product';

            return {
                qty: productData.qty,
                price: productData.price,
                total: productData.total,
                productName, // Назва товару у потрібній локалізації
            };
        });

        res.json({
            success: true,
            data: {
                address: order.address,
                productsData: formattedProducts, // Форматований список товарів
                shipping: order.shipping,
                totalCost: order.totalCost,
                user: order.user,
                createdAt: order.createdAt,
                _id: order._id,
            },
        });
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

        await NewUserOrderMessage(order); // Відправляємо лист на пошту користувача, про успішне створення замовлення, та додаємо деталі про замовлення.

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
