import { validationResult } from 'express-validator';
import Reviews from '../../../shared/models/Reviews.js';
import User from '../../../shared/models/User.js';

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
            .populate('product', 'name.US images') // через пробіл можна додавати властивості які будуть передані
            .lean();

        // Перетворюємо name з об'єкта { US: string } у простий рядок
        // Попередньо завантажуємо зареєстрованих користувачів за email, щоб уникнути N+1
        const uniqueEmails = Array.from(new Set(reviews.map((r) => (r.user && r.user.email ? r.user.email : null)).filter((e) => Boolean(e))));
        const users = uniqueEmails.length
            ? await User.find({ email: { $in: uniqueEmails } })
                  .select('firstName lastName email avatar _id')
                  .lean()
            : [];
        const emailToUser = new Map(users.map((u) => [u.email, u]));

        const normalizedReviews = reviews.map((review) => {
            if (review.product) {
                // Нормалізація назви продукту до рядка US
                if (review.product.name && typeof review.product.name === 'object') {
                    review.product.name = review.product.name.US || '';
                }

                // Нормалізація зображення: беремо лише перше та повертаємо лише small
                if (Array.isArray(review.product.images) && review.product.images.length > 0) {
                    const firstImage = review.product.images[0];
                    const largePath = firstImage.path || '';
                    const smallPath = largePath.includes('/upload/') ? largePath.replace('/upload/', '/upload/small/') : largePath;

                    review.product.image = smallPath;
                }
                // Прибираємо зайве поле images, залишаємо лише image
                if (review.product && review.product.images) {
                    delete review.product.images;
                }
            }
            // Збагачуємо/нормалізуємо дані користувача за email
            const reviewEmail = review.user && review.user.email ? review.user.email : null;
            if (reviewEmail && emailToUser.has(reviewEmail)) {
                const u = emailToUser.get(reviewEmail);
                review.user = {
                    email: u.email,
                    _id: u._id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    avatar: u.avatar,
                };
            } else {
                review.user = {
                    email: reviewEmail || '',
                    firstName: review.user && review.user.firstName ? review.user.firstName : '',
                    lastName: review.user && review.user.lastName ? review.user.lastName : '',
                    _id: null,
                    avatar: '',
                };
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
        const { productId, rate = 0, firstName, lastName, email, comment, parentId = null } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Відсутній productId' });
        }
        if (!comment) {
            return res.status(400).json({ success: false, message: 'Відсутній текст коментаря' });
        }

        const reviewDoc = new Reviews({
            user: {
                firstName,
                lastName,
                email,
            },
            product: productId,
            rate,
            comment,
            parent: parentId,
        });

        const savedReviews = await reviewDoc.save();

        const data = await Reviews.findById(savedReviews._id).populate('product', 'name.US images').lean();

        // Нормалізуємо назву та перше зображення аналогічно до getAll
        if (data && data.product) {
            if (data.product.name && typeof data.product.name === 'object') {
                data.product.name = data.product.name.US || '';
            }
            if (Array.isArray(data.product.images) && data.product.images.length > 0) {
                const firstImage = data.product.images[0];
                const largePath = firstImage.path || '';
                const smallPath = largePath.includes('/upload/') ? largePath.replace('/upload/', '/upload/small/') : largePath;
                data.product.image = smallPath;
            }
            // Прибираємо зайве поле images, залишаємо лише image
            if (data.product && data.product.images) {
                delete data.product.images;
            }
        }

        res.json({ success: true, review: data });
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
