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
            .populate('product', 'name.US images') // через пробіл можна додавати властивості які будуть передані
            .lean();

        // Перетворюємо name з об'єкта { US: string } у простий рядок
        const normalizedReviews = reviews.map((review) => {
            if (review.product) {
                // Нормалізація назви продукту до рядка US
                if (review.product.name && typeof review.product.name === 'object') {
                    review.product.name = review.product.name.US || '';
                }

                // Нормалізація зображення: беремо лише перше та повертаємо { originalname, small, large }
                if (Array.isArray(review.product.images) && review.product.images.length > 0) {
                    const firstImage = review.product.images[0];
                    const largePath = firstImage.path || '';
                    const smallPath = largePath.includes('/upload/') ? largePath.replace('/upload/', '/upload/small/') : largePath;

                    review.product.images = {
                        originalname: firstImage.originalname || '',
                        small: smallPath,
                        large: largePath,
                    };
                }
            }
            return review;
        });

        // Відправляємо відгуки та загальну кількість у відповіді
        res.json({
            reviews: normalizedReviews,
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
