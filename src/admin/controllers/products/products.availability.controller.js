import { validationResult } from 'express-validator';
import ProductAvailability from '../../../shared/models/Product.availability.js';

export const getAll = async (req, res) => {
    try {
        const availability = await ProductAvailability.find();
        res.json(availability);
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

        const data = req.body;
        const doc = new ProductAvailability(data);
        const saved = await doc.save();

        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const availabilityData = req.body;

        const results = await Promise.all(
            availabilityData.map(async (item) => {
                if (item._id) {
                    return ProductAvailability.findByIdAndUpdate(item._id, item, { new: true });
                } else {
                    return new ProductAvailability(item).save();
                }
            }),
        );

        res.json({ success: true, data: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
