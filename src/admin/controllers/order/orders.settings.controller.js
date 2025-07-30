import { validationResult } from 'express-validator';
import Settings from '../../../shared/models/Orders.settings.js';

export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.find();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const [firstSetting] = await Settings.find();

        //  Якщо firstSetting відсутній, тоді створюємо новий
        if (!firstSetting) {
            const { status } = req.body;

            const orderStatus = new Settings({
                status,
            });

            const data = await orderStatus.save();

            return res.json({
                success: true,
                data,
            });
        }

        // Інакше, просто оновлюємо все що є!
        const updatedSetting = await Settings.findByIdAndUpdate(firstSetting._id, req.body, {
            new: true,
        });

        res.json({ success: true, data: updatedSetting });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
