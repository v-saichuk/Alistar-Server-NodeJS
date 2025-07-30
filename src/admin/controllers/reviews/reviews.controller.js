import { validationResult } from 'express-validator';
import Reviews from '../../../shared/models/Reviews.js';

export const getAll = async (req, res) => {
    try {
        // Отримуємо номер сторінки та розмір сторінки з параметрів шляху
        const { page = 1, pageSize = 10 } = req.params;

        // Перетворюємо параметри в числа
        const pageNumber = parseInt(page, 10);
        const pageSizeNumber = parseInt(pageSize, 10);

        // Підрахуйте загальну кількість відгуків
        const totalReviews = await Reviews.countDocuments();

        // Обчислюємо, скільки відгуків потрібно пропустити
        const skip = (pageNumber - 1) * pageSizeNumber;

        // Отримуємо відгуки з пропусками та обмеженням
        const reviews = await Reviews.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(pageSizeNumber)
            .populate('user', 'lastName firstName avatar')
            .populate('product', 'name images'); // через пробіл можна додавати властивості які будуть передані

        // Відправляємо відгуки та загальну кількість у відповіді
        res.json({
            reviews,
            totalReviews,
        });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const create = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    try {
        const reviews = new Reviews(req.body);
        const savedReviews = await reviews.save();
        const data = await Reviews.findById(savedReviews._id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const { reviewsId } = req.params;
        const { comment } = req.body;

        await Reviews.updateOne({ _id: reviewsId }, { comment });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

export const remove = async (req, res) => {
    try {
        const { reviewsId } = req.params;
        const deletedReviews = await Reviews.findByIdAndDelete(reviewsId);

        if (!deletedReviews) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Відгук не знайдено!',
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};
