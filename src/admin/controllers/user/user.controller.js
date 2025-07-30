import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import User from '../../../shared/models/User.js';
import Role from '../../../shared/models/Role.js';
import Order from '../../../shared/models/Order.js';
import { createNewUser } from '../../../shared/utils/createNewUser.js';

export const getAllUsers = async (req, res) => {
    try {
        const { page, pageSize } = req.params;

        const totalUsers = await User.countDocuments();
        const skip = (page - 1) * pageSize;
        const users = await User.find().sort({ _id: -1 }).skip(skip).limit(pageSize).populate('role');

        res.json({ users, totalUsers });
    } catch (err) {
        console.log('Помилка в отримані користувачів =>', err);
        res.status(500).json({
            success: false,
            message: 'Невдалось откримати користувачів',
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User Not Found',
            });
        }

        const ordersCount = await Order.find({ user: req.userId }).countDocuments();

        const { passwordHash, ...userData } = user._doc;
        const updatedUserData = { orders: ordersCount, ...userData };

        return res.json(updatedUserData);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'User Error!',
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('role');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Користувач не знайдений!',
            });
        }

        const { passwordHash, ...userData } = user._doc;

        res.json(userData);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалося знайти користувача!',
        });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const person = await User.findOne({ email: req.body.email });
        if (person) {
            return res.status(409).json({
                success: false,
                message: 'Користувач з таким email вже зареєстрований!',
            });
        }
        const role = await Role.findOne({ _id: req.body.role });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Така посада не знайдена!',
            });
        }

        const { password, ...other } = req.body;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const doc = new User({ ...other, passwordHash });

        const user = await doc.save();
        const token = jwt.sign(
            {
                _id: user._id,
            },
            process.env.SECRET_KEY,
            {
                expiresIn: process.env.TOKEN_EXISTENCE,
            },
        );

        res.json({
            ...user._doc,
            token,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка в створені користувача!',
        });
    }
};

export const update = async (req, res) => {
    try {
        const userId = req.params.id;
        const person = await User.findOne({ _id: userId });
        const { password, ...other } = req.body;

        const newPasswordHash = async () => {
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(password, salt);
            return newPasswordHash;
        };

        await User.updateOne(
            {
                _id: userId,
            },
            { ...other, passwordHash: req.body.password ? await newPasswordHash() : person.passwordHash },
        );

        res.json({
            success: true,
            message: 'Користувач успішно відредагований!',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: `Сталась помилка в редагуванні! ${err}`,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const userId = req.params.id;

        // Отримання першого користувача зі списку
        const firstUser = await User.findOne().sort({ createdAt: 1 }).exec();

        // Перевірка, чи ID користувача збігається з ID першого користувача
        if (firstUser && firstUser._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Ви не можете видалити цього користувача!',
            });
        }

        // Видалення користувача
        User.findOneAndDelete({ _id: userId }, (err, doc) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Помилка видалення користувача!',
                    err,
                });
            }

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Користувача не знайдено!',
                });
            }

            res.json({
                success: true,
                message: 'Корисувач успішно видалений',
            });
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка видалення користувача!',
        });
    }
};
