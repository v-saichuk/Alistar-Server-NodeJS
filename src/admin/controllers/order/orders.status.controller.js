import OrderStatus from '../../../shared/models/Order.status.js';
import { validationResult } from 'express-validator';

export const getAll = async (req, res) => {
    try {
        const statuses = await OrderStatus.find();
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        await OrderStatus.create(req.body);
        const Statuses = await OrderStatus.find();

        res.json({
            data: Statuses,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при створені нового статусу!',
            err,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedStatus = await OrderStatus.findByIdAndDelete(id);

        if (!deletedStatus) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Статус не знайдено!',
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

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        await OrderStatus.updateOne({ _id: id }, { ...req.body });
        const Statuses = await OrderStatus.find();

        res.json({
            success: true,
            data: Statuses,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось оновити статус!',
            error: err,
        });
    }
};
