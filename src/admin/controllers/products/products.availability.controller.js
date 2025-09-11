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

        const availabilityData = Array.isArray(req.body) ? req.body : [];

        const itemsWithId = availabilityData.filter((item) => item && item._id);
        const itemsWithoutId = availabilityData.filter((item) => item && !item._id);

        const updateOps = itemsWithId.map((item) => {
            const { _id, ...updateFields } = item;
            return {
                updateOne: {
                    filter: { _id },
                    update: { $set: updateFields },
                },
            };
        });

        if (updateOps.length > 0) {
            await ProductAvailability.bulkWrite(updateOps, { ordered: false });
        }

        let insertedDocs = [];
        if (itemsWithoutId.length > 0) {
            insertedDocs = await ProductAvailability.insertMany(itemsWithoutId, { ordered: false });
        }

        const keepIds = [...itemsWithId.map((i) => i._id), ...insertedDocs.map((doc) => doc._id)];

        await ProductAvailability.deleteMany({ _id: { $nin: keepIds } });

        const all = await ProductAvailability.find();

        res.json({ success: true, data: all });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
