import { validationResult } from 'express-validator';
import Order from '../../../shared/models/Order.js';
import Product from '../../../shared/models/Product.js';

import { generateUniqueOrderId } from '../../../shared/utils/generateUniqueNumber.js';

// Get all orders (with pagination)
export const getAll = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const take = Math.min(Math.max(parseInt(req.query.take, 10) || 10, 1), 100);
        const skip = (page - 1) * take;

        const filter = {};

        const [totalOrders, orders] = await Promise.all([
            Order.countDocuments(filter),
            Order.find(filter)
                .select('-comment -statusHistory -payments -delivery -billing')
                .populate({
                    path: 'productsData.product',
                    select: 'name images', // _id включено за замовчуванням
                })
                .populate({
                    path: 'status',
                    select: 'title color description',
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .lean(),
        ]);

        const minimized = orders.map((order) => {
            if (Array.isArray(order.productsData)) {
                order.productsData = order.productsData.map((item) => {
                    const p = item.product;
                    if (p && typeof p === 'object') {
                        const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                        const largePath = firstImage?.path || null;
                        const smallPath = largePath ? largePath.replace('/upload/', '/upload/small/') : null;
                        return {
                            ...item,
                            product: {
                                _id: p._id,
                                name: p.name && p.name.US ? p.name.US : '',
                                images: {
                                    large: largePath,
                                    small: smallPath,
                                    originalname: firstImage?.originalname || '',
                                },
                            },
                        };
                    }
                    return item;
                });
            }
            if (order.status && typeof order.status === 'object') {
                const uaTitle = order.status.title && order.status.title.UA ? order.status.title.UA : '';
                order.status = {
                    title: uaTitle,
                    color: order.status.color,
                    description: order.status.description,
                };
            }
            // Extract only country from shipping and remove the shipping object
            if (order.shipping && typeof order.shipping === 'object') {
                order.country = order.shipping.country || '';
                order.customerFullName = order.shipping.first_name + ' ' + order.shipping.last_name || '';
                delete order.shipping;
            }
            return order;
        });

        res.json({ orders: minimized, totalOrders, page, take });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const getById = async (req, res) => {
    try {
        const { orderNum } = req.params;
        const order = await Order.findOne({ orderId: orderNum }).populate('productsData.product').populate('status');

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false });
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

        const { cartProducts, delivery, comment: _omitComment, ...other } = req.body;

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

        const { comment: _omitComment, ...orderData } = req.body;

        await Order.updateOne({ _id: ORDER_PAGE_ID }, orderData);

        const ORDER = await Order.findById(ORDER_PAGE_ID).select('-comment').populate('productsData.product');

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

        // Оновлюємо статус і записуємо історію з автором змін
        await Order.updateOne(
            { _id: ORDER_PAGE_ID },
            {
                $set: { status },
                $push: {
                    statusHistory: {
                        status: String(status),
                        date: new Date(),
                        changedBy: req.userId || null,
                    },
                },
            },
        );
        res.json({ success: true });
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

// Позначити замовлення як переглянуте і записати хто переглянув
export const markVisited = async (req, res) => {
    try {
        const { id: ORDER_PAGE_ID } = req.params;
        const userId = req.userId || null;

        // Оновити visited=true, додати в viewedBy якщо такого запису ще немає
        const update = {
            $set: { visited: true },
        };

        if (userId) {
            update.$push = {
                viewedBy: { user: userId, date: new Date() },
            };
        }

        const result = await Order.updateOne({ _id: ORDER_PAGE_ID }, update);

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Замовлення не знайдено' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// Отримати кількість нових (непереглянутих) замовлень
export const getNewCount = async (req, res) => {
    try {
        const count = await Order.countDocuments({ visited: false });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
