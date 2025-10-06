import Product from '../../../shared/models/Product.js';
import Language from '../../../shared/models/Language.js';
import User from '../../../shared/models/User.js';
import Order from '../../../shared/models/Order.js';
import mongoose from 'mongoose';

function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[._@-]/g, ' ')
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);
}

function escapeRegex(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchProducts = async (req, res) => {
    try {
        const { q = '', page = 1, pageSize = 10, field } = req.body || {};

        const pageNum = Math.max(Number(page) || 1, 1);
        const take = Math.max(Number(pageSize) || 10, 1);
        const skip = (pageNum - 1) * take;

        // Always use English for name search. Resolve internal code via Language.urlCode = 'en'
        const enLang = (await Language.findOne({ urlCode: 'en' })) || null;
        const enCode = enLang?.code || 'US';

        const tokens = tokenize(q);

        // Build base condition (only active products)
        const andConditions = [{ active: true }];

        if (tokens.length > 0) {
            if (field === 'name') {
                // All tokens must match name in EN
                tokens.forEach((t) => {
                    andConditions.push({ [`name.${enCode}`]: { $regex: t, $options: 'i' } });
                });
            } else if (field === 'sku') {
                tokens.forEach((t) => {
                    andConditions.push({ sku: { $regex: t, $options: 'i' } });
                });
            } else if (field === 'partNumber') {
                tokens.forEach((t) => {
                    andConditions.push({ part_number: { $regex: t, $options: 'i' } });
                });
            } else {
                // Default: search across name(EN), sku, part_number
                tokens.forEach((t) => {
                    andConditions.push({
                        $or: [
                            { [`name.${enCode}`]: { $regex: t, $options: 'i' } },
                            { sku: { $regex: t, $options: 'i' } },
                            { part_number: { $regex: t, $options: 'i' } },
                        ],
                    });
                });
            }
        }

        const query = { $and: andConditions };

        const totalProducts = await Product.countDocuments(query);

        const productsRaw = await Product.find(query, {
            _id: 1,
            images: 1,
            sku: 1,
            part_number: 1,
            slug: 1,
            [`name.${enCode}`]: 1,
        })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(take)
            .lean();

        const products = productsRaw.map((p) => ({
            _id: p._id,
            name: p?.name?.[enCode] || '',
            slug: p?.slug?.[enCode] || '',
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0]?.path || null : null,
            sku: p.sku || '',
            part_number: p.part_number || '',
        }));

        return res.json({ products, totalProducts });
    } catch (error) {
        return res.status(500).json({ success: false, error: error?.message || 'Server error' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q = '', limit = 10, cursor } = req.query;

        const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
        const raw = String(q || '').trim();
        const isEmailLike = raw.includes('@') && raw.includes('.');
        const tokens = tokenize(raw);
        const safeRaw = escapeRegex(raw);

        let query = {};

        if (isEmailLike) {
            const [localPart = ''] = raw.split('@');
            const localTokens = tokenize(localPart);

            const exactEmail = { email: { $regex: `^${escapeRegex(raw)}$`, $options: 'i' } };

            const localTokenConditions = localTokens.map((t) => ({
                $or: [
                    { firstName: { $regex: escapeRegex(t), $options: 'i' } },
                    { lastName: { $regex: escapeRegex(t), $options: 'i' } },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: ['$firstName', ' ', '$lastName'] },
                                regex: escapeRegex(t),
                                options: 'i',
                            },
                        },
                    },
                ],
            }));

            query = { $or: [exactEmail] };
            if (localTokens.length > 0) {
                query.$or.push({ $and: localTokenConditions });
            }
        } else {
            // Базовий пошук по повному рядку (ім'я/прізвище/ПІБ/email частковий)
            const baseOr = [
                { email: { $regex: safeRaw, $options: 'i' } },
                { firstName: { $regex: safeRaw, $options: 'i' } },
                { lastName: { $regex: safeRaw, $options: 'i' } },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $concat: ['$firstName', ' ', '$lastName'] },
                            regex: safeRaw,
                            options: 'i',
                        },
                    },
                },
            ];

            // Токенізований пошук (кожен токен має співпасти хоча б в одному з полів)
            const tokenConditions = tokens.map((t) => ({
                $or: [
                    { email: { $regex: escapeRegex(t), $options: 'i' } },
                    { firstName: { $regex: escapeRegex(t), $options: 'i' } },
                    { lastName: { $regex: escapeRegex(t), $options: 'i' } },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: ['$firstName', ' ', '$lastName'] },
                                regex: escapeRegex(t),
                                options: 'i',
                            },
                        },
                    },
                ],
            }));

            if (tokens.length > 0 && raw) {
                query = { $or: [{ $and: tokenConditions }, { $or: baseOr }] };
            } else if (tokens.length > 0) {
                query = { $and: tokenConditions };
            } else if (raw) {
                query = { $or: baseOr };
            }
        }

        if (cursor) {
            try {
                query._id = { ...(query._id || {}), $lt: new mongoose.Types.ObjectId(cursor) };
            } catch (e) {
                // ignore invalid cursor
            }
        }

        const usersRaw = await User.find(query, {
            _id: 1,
            avatar: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
        })
            .sort({ _id: -1 })
            .limit(take)
            .lean();

        const users = usersRaw.map((u) => ({
            id: u._id,
            avatar: u.avatar || '',
            fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            email: u.email || '',
        }));

        const nextCursor = usersRaw.length === take ? String(usersRaw[usersRaw.length - 1]._id) : null;

        return res.json({ users, nextCursor, limit: take });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Search error', error: err?.message });
    }
};

export const searchOrders = async (req, res) => {
    try {
        const { q = '', limit = 10, cursor, field } = req.query;

        const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
        const raw = String(q || '').trim();
        const safeRaw = escapeRegex(raw);

        // Якщо немає запиту, повертаємо порожній результат, щоб уникнути важкого списку
        if (!raw) {
            return res.json({ orders: [], nextCursor: null, limit: take });
        }

        const query = {};

        if (field === 'customerEmail') {
            // Частичний, нечутливий до регістру пошук на shipping.email
            query['shipping.email'] = { $regex: safeRaw, $options: 'i' };
        } else {
            // Звичайний пошук та 'ORDERNO': нормалізуємо, видаляючи 'AL' і всі нецифрові символи, потім шукаємо підрядок
            const normalized = raw.replace(/al/gi, '').replace(/[^0-9]/g, '');
            if (!normalized) {
                return res.json({ orders: [], nextCursor: null, limit: take });
            }
            query.orderId = { $regex: escapeRegex(normalized), $options: 'i' };
        }

        if (cursor) {
            try {
                query._id = { ...(query._id || {}), $lt: new mongoose.Types.ObjectId(cursor) };
            } catch (e) {
                // ignore invalid cursor
            }
        }

        const ordersRaw = await Order.find(query, {
            _id: 1,
            orderId: 1,
            shipping: 1,
            totalCost: 1,
            status: 1,
            createdAt: 1,
        })
            .populate({
                path: 'status',
                select: 'title color description',
            })
            .sort({ _id: -1 })
            .limit(take)
            .lean();

        const orders = ordersRaw.map((o) => {
            let status = o.status;
            if (status && typeof status === 'object') {
                status = {
                    title: (status.title && status.title.UA) || '',
                    color: status.color,
                    description: status.description,
                };
            }
            const firstName = o?.shipping?.first_name || '';
            const lastName = o?.shipping?.last_name || '';
            const email = o?.shipping?.email || '';
            return {
                id: o._id,
                orderId: o.orderId,
                customerFullName: `${firstName} ${lastName}`.trim(),
                customerEmail: email,
                totalCost: o.totalCost || 0,
                status,
                createdAt: o.createdAt,
            };
        });

        const nextCursor = ordersRaw.length === take ? String(ordersRaw[ordersRaw.length - 1]._id) : null;

        return res.json({ orders, nextCursor, limit: take });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Search error', error: err?.message });
    }
};
