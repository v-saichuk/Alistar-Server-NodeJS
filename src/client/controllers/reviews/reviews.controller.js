import { validationResult } from 'express-validator';
import Reviews from '../../../shared/models/Reviews.js';

export const getProductToClient = async (req, res) => {
    try {
        // Отримуємо номер сторінки та розмір сторінки з параметрів шляху
        const { productId } = req.params;

        // Підрахуйте загальну кількість відгуків
        const totalReviews = await Reviews.find({ product: productId }).countDocuments();

        // Отримуємо відгуки з пропусками та обмеженням
        const reviews = await Reviews.find({ product: productId }).sort({ _id: -1 }).populate('user', 'lastName firstName avatar');

        res.json({
            reviews,
            totalReviews,
        });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
