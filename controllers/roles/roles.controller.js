import Role from '../../models/Role.js';
import User from '../../models/User.js';
import { validationResult } from 'express-validator';

export const getAll = async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка отримання посади!',
        });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const doc = new Role({ ...req.body });
        const role = await doc.save();

        res.json({
            success: true,
            message: 'Посада успішно створена!',
            role,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка створеня посади!',
        });
    }
};

export const update = async (req, res) => {
    try {
        const roleId = req.params.id;

        await Role.updateOne({ _id: roleId }, { ...req.body });

        res.json({
            success: true,
            message: 'Посада успішно оновлена!',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка в редагувані посади!',
        });
    }
};

export const remove = async (req, res) => {
    try {
        const roleId = req.params.id;

        // Перевіряємо наявність користувачів з даною роллю
        const usersWithRole = await User.find({ role: roleId });

        if (usersWithRole.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ви не можете видалити посаду поки в ній є користувачі',
            });
        }

        Role.findOneAndDelete({ _id: roleId }, (err, doc) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Помилка в видалені посади!',
                    err,
                });
            }
            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Посада не знайдена!',
                    err,
                });
            }

            res.json({
                success: true,
                message: 'Посада успішно видалена!',
            });
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка в видалені посади!',
            err,
        });
    }
};
