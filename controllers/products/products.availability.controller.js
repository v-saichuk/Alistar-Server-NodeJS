import ProductAvailability from '../../models/Product.availability.js';
import { validationResult } from 'express-validator';

export const getAvailability = async (req, res) => {
    try {
        const availability = await ProductAvailability.find();
        res.json(availability);
    } catch (error) {
        res.status(500).json({ success: false, error });
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
