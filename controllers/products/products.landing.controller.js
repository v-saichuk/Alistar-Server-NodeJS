import Product from '../../models/Product.js';
import Language from '../../models/Language.js';

// Функція для екранування спеціальних символів у регулярних виразах
const escapeRegExps = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& означає весь знайдений рядок

export const getProducts = async (req, res) => {
    try {
        const { language, subCategories, page = 1, pageSize = 10, rangePrice, category } = req.body;
        let filter = {};

        // Формування фільтру для категорій
        if (category) {
            filter.category = category;
        }

        // Формування фільтрів для підкатегорій
        const activeSubCategoryFilters = Object.values(subCategories).flat();
        if (activeSubCategoryFilters.length > 0) {
            const andSubCategoryConditions = [];
            for (const [categoryId, subCategory] of Object.entries(subCategories)) {
                const subCategoryConditions = subCategory.map((value) => ({
                    [`sub_categories.${categoryId}.${language}`]: { $regex: new RegExp(`^${escapeRegExps(value)}$`, 'i') },
                }));
                andSubCategoryConditions.push({ $or: subCategoryConditions });
            }
            if (!filter.$and) {
                filter.$and = [];
            }
            filter.$and.push(...andSubCategoryConditions);
        }

        // Додавання фільтру за ціною
        if (rangePrice && rangePrice.length === 2) {
            const [minPrice, maxPrice] = rangePrice;
            filter[`price.${language}`] = { $gte: minPrice, $lte: maxPrice };
        }

        const totalProducts = await Product.countDocuments(filter);
        const skip = (page - 1) * pageSize;
        const products = await Product.find(filter).sort({ _id: -1 }).skip(skip).limit(pageSize);

        res.json({ products, totalProducts });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// 🔧 Функція токенізації запиту
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[-_]/g, ' ') // заміна дефісів і підкреслень на пробіли
        .replace(/[^\w\s]/g, '') // видалення спецсимволів
        .split(/\s+/) // поділ за пробілами
        .filter(Boolean); // видалення порожніх значень
}

export const getSearch = async (req, res) => {
    try {
        const { lang, text } = req.params;

        const language = await Language.findOne({ urlCode: lang });
        if (!language) {
            return res.status(400).json({ success: false, message: 'Language not found' });
        }

        const code = language.code;

        // Токенізація запиту
        const tokens = tokenize(text);

        // Формуємо $and-умову для всіх токенів
        const tokenConditions = tokens.map((token) => ({
            $or: [
                { [`name.${code}`]: { $regex: token, $options: 'i' } },
                { part_number: { $regex: token, $options: 'i' } },
                { sku: { $regex: token, $options: 'i' } },
            ],
        }));

        const conditions = {
            $and: [
                { active: true }, // Тільки активні товари
                ...tokenConditions,
            ],
        };

        let products = await Product.find(conditions, {
            _id: 1,
            images: 1,
            [`name.${code}`]: 1,
            [`slug.${code}`]: 1,
            sku: 1,
        }).limit(30);

        // Форматування відповіді
        products = products.map((product) => {
            const productObject = product.toObject();
            return {
                _id: productObject._id,
                name: productObject.name?.[code] || '',
                slug: productObject.slug?.[code] || '',
                image: productObject.images?.[0]?.path || null,
                sku: productObject.sku || '',
            };
        });

        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
