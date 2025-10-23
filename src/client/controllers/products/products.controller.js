import axios from 'axios';
import Product from '../../../shared/models/Product.js';
import Reviews from '../../../shared/models/Reviews.js';
import Language from '../../../shared/models/Language.js';
import Category from '../../../shared/models/Categories/Categories.js';
import SubCategory from '../../../shared/models/Categories/SubCategories.js';
import SubSubCategory from '../../../shared/models/Categories/SubSubCategories.js';
import { normalizeImageUrl, normalizeSmallImageUrl } from '../../../shared/utils/normalizeImageUrl.js';

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
                image: normalizeImageUrl(productObject.images?.[0]?.path || ''),
                sku: productObject.sku || '',
            };
        });

        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const getFilters = async (req, res) => {
    try {
        let categories = JSON.parse(req.query.categories);
        const lang = req.query.lang;
        const langDoc = await Language.findOne({ urlCode: lang });

        const query = {}; // Побудуйте об'єкт запиту для фільтрації

        // Фільтрація за категоріями
        if (categories && categories.length > 0) {
            categories = categories.filter((category) => category !== null);

            if (categories.length > 0) {
                query.category = { $all: categories };
            }
        }

        const products = await Product.find(query, { parameters: 1 });

        // Масив для зберігання унікальних значень параметрів
        const parameters = [];
        // Проходимо через всі товари та збираємо унікальні значення параметрів
        products.forEach((product) => {
            product.parameters.forEach((param) => {
                // Перевіряємо, чи параметр повинен відображатися у фільтрах
                if (param?.visible?.filter) {
                    const paramName = param.name[langDoc.code]; // Використовуємо динамічну мову

                    if (paramName) {
                        // Знаходимо або створюємо фільтр для даного параметра
                        let existingParam = parameters.find((p) => p.name === paramName);

                        if (!existingParam) {
                            existingParam = { name: paramName, params: new Set() };
                            parameters.push(existingParam);
                        }

                        // Додаємо тільки активні значення в Set
                        param.list.forEach((item) => {
                            existingParam.params.add(item.title);
                        });
                    }
                }
            });
        });

        // Конвертуємо Set в масив та підготовлюємо фінальний результат
        const parametrs = parameters.map((param) => ({
            label: param.name,
            title: param.name,
            options: Array.from(param.params).map((el) => ({ label: el, value: el })),
        }));

        res.json({ parametrs });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const { categorySlug, subCategorySlug, subSubCategorySlug } = req.params;
        const { lang, fallbackLang = 'en', page = 1, currency } = req.query;

        // ⬇️ Обробка filters
        let filters = {};
        try {
            if (req.query.filters) {
                filters = JSON.parse(req.query.filters);
            }
        } catch (e) {
            console.warn('❌ Невірний формат filters:', req.query.filters);
            filters = {};
        }

        const pageSize = 24;
        const pageNum = Math.max(Number(page), 1);
        const skip = (pageNum - 1) * pageSize;

        const langDoc = await Language.findOne({ urlCode: lang });
        const fallbackLangDoc = await Language.findOne({ urlCode: fallbackLang });

        if (!langDoc || !fallbackLangDoc) {
            return res.status(400).json({ success: false, message: 'Invalid language codes' });
        }

        const langCode = langDoc.code;
        const fallbackCode = fallbackLangDoc.code;

        // ⬇️ Категорії по slug
        const category =
            (await Category.findOne({ [`slug.${langCode}`]: categorySlug })) || (await Category.findOne({ [`slug.${fallbackCode}`]: categorySlug }));

        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        const subCategory =
            (await SubCategory.findOne({ [`slug.${langCode}`]: subCategorySlug, parent: category._id })) ||
            (await SubCategory.findOne({ [`slug.${fallbackCode}`]: subCategorySlug, parent: category._id }));

        if (!subCategory) return res.status(404).json({ success: false, message: 'SubCategory not found' });

        let subSubCategory = null;
        if (subSubCategorySlug) {
            subSubCategory =
                (await SubSubCategory.findOne({ [`slug.${langCode}`]: subSubCategorySlug, parent: subCategory._id })) ||
                (await SubSubCategory.findOne({ [`slug.${fallbackCode}`]: subSubCategorySlug, parent: subCategory._id }));

            if (!subSubCategory) {
                return res.status(404).json({ success: false, message: 'SubSubCategory not found' });
            }
        }

        // ⬇️ Валюта
        let exchangeRate = 1;
        let currencyCode = 'USD';
        let currencySymbol = '$';

        if (currency) {
            const currencyLangDoc = await Language.findOne({ currency: currency.toUpperCase() });
            if (currencyLangDoc) {
                currencyCode = currencyLangDoc.currency.toUpperCase();
                currencySymbol = currencyLangDoc.currencySymbol;
            }
        }

        if (currencyCode !== 'USD') {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await axios.get(`https://minfin.com.ua/api/coin/day/usd/${currencyCode.toLowerCase()}/${today}`);
                exchangeRate = Number(response.data.data[0].course) || 1;
            } catch (e) {
                console.error('⚠️ Помилка курсу валюти:', e.message);
                exchangeRate = 1;
                currencySymbol = '$';
            }
        }

        // ⬇️ Побудова основного query
        const query = {
            active: true,
            isCatalog: true, // ⬅️ Додаємо фільтр
            category: subSubCategory
                ? { $all: [category._id.toString(), subCategory._id.toString(), subSubCategory._id.toString()] }
                : { $all: [category._id.toString(), subCategory._id.toString()] },
        };

        // ⬇️ Додавання параметрів фільтрів
        if (Object.keys(filters).length > 0) {
            query.parameters = {
                $all: Object.entries(filters).map(([paramName, values]) => ({
                    $elemMatch: {
                        [`name.${langCode}`]: paramName,
                        list: {
                            $elemMatch: {
                                title: { $in: values },
                            },
                        },
                    },
                })),
            };
        }

        const totalProducts = await Product.countDocuments(query);

        const products = await Product.find(query, {
            [`name.${langCode}`]: 1,
            [`name.${fallbackCode}`]: 1,
            sku: 1,
            price: 1,
            images: 1,
            slug: 1,
            availability: 1,
            parameters: 1,
            category: 1,
            subCategory: 1,
            subSubCategory: 1,
        })
            .skip(skip)
            .limit(pageSize)
            .select('-description')
            .populate('availability');

        const productsWithDetails = await Promise.all(
            products.map(async (product) => {
                const totalReviews = await Reviews.countDocuments({ product: product._id });
                const reviews = await Reviews.find({ product: product._id }, 'rate');
                const totalRateSum = reviews.reduce((sum, review) => sum + review.rate, 0);
                const averageRate = totalReviews > 0 ? Number((totalRateSum / totalReviews).toFixed(1)) : 0;

                const name = product.name?.[langCode] || product.name?.[fallbackCode] || '';
                const images = (product.images || []).map((image) => ({
                    alt: image.originalname,
                    large: normalizeImageUrl(image.path),
                    small: normalizeSmallImageUrl(image.path),
                }));

                // === 🧠 Обробка параметрів з productSKU ===
                // Збираємо всі SKU, що прив’язані в параметрах
                const productSKUs =
                    product.parameters
                        ?.flatMap((param) => param.list || [])
                        .filter((item) => !!item.productSKU)
                        .map((item) => item.productSKU) || [];

                // Отримуємо товари за ці SKU, і витягуємо лише slug та sku
                const relatedProducts = await Product.find(
                    { sku: { $in: productSKUs } },
                    { sku: 1, [`slug.${langCode}`]: 1, [`slug.${fallbackLang}`]: 1 },
                ).lean();

                // Створюємо мапу sku → slug
                const skuToSlugMap = Object.fromEntries(
                    relatedProducts.map((item) => [item.sku, item.slug?.[langCode] || item.slug?.[fallbackLang] || '']),
                );

                // Формуємо оновлений список параметрів
                const transformedParameters = (product.parameters || []).map((param) => ({
                    name: param.name?.[langCode] || param.name?.[fallbackLang] || '',
                    visible: param.visible || {},
                    list: (param.list || []).map((item) => {
                        const slug = item.productSKU && skuToSlugMap[item.productSKU] ? skuToSlugMap[item.productSKU] : '';
                        return {
                            title: item.title,
                            slug,
                            active: item.active || false,
                        };
                    }),
                }));

                const category = await Category.findById(product.category[0], { [`name.${langCode}`]: 1 });
                const subCategory = await SubCategory.findById(product.category[1], { [`name.${langCode}`]: 1 });
                const subSubCategory = await SubSubCategory.findById(product.category[2], { [`name.${langCode}`]: 1 });

                return {
                    _id: product._id,
                    slug: product.slug?.[langCode] || product.slug?.[fallbackCode] || '',
                    sku: product.sku,
                    name,
                    price: +(product.price * exchangeRate).toFixed(2),
                    defaultPrice: product.price,
                    currency: currencySymbol,
                    image: images?.[0],
                    averageRate,
                    totalReviews,
                    availability: {
                        title: product.availability?.title?.[langCode] || product.availability?.title?.[fallbackCode] || '',
                        color: product.availability?.color || '',
                    },
                    parameters: transformedParameters,
                    category: category?.name?.[langCode] || category?.name?.[fallbackCode] || '',
                    subCategory: subCategory?.name?.[langCode] || subCategory?.name?.[fallbackCode] || '',
                    subSubCategory: subSubCategory?.name?.[langCode] || subSubCategory?.name?.[fallbackCode] || '',
                };
            }),
        );

        // Отримаємо всі активні мови
        const allLanguages = await Language.find({});
        const categorySlugs = category.slug || {};
        const subCategorySlugs = subCategory.slug || {};
        const subSubCategorySlugs = subSubCategory?.slug || {};

        const alternates = [];

        for (const langObj of allLanguages) {
            const _langCode = langObj.code;
            const _urlCode = langObj.urlCode;

            // Перевіряємо наявність slug-ів для цієї мови
            const catSlug = categorySlugs[_langCode] || '';
            const subCatSlug = subCategorySlugs[_langCode] || '';
            const subSubCatSlug = subSubCategory ? subSubCategorySlugs[_langCode] || '' : null;

            // Пропускаємо, якщо хоч щось з slug-ів не задано
            if (!catSlug || !subCatSlug || (subSubCategory && !subSubCatSlug)) continue;

            // Формуємо url
            let url = `https://alistar.ltd/${_urlCode}/catalog/${catSlug}/${subCatSlug}`;
            if (subSubCategory) url += `/${subSubCatSlug}`;

            alternates.push({
                hreflang: _urlCode.toLowerCase(),
                href: url,
            });
        }

        // canonical (актуальна сторінка)
        let canonical = `https://alistar.ltd/${lang}/catalog/${category.slug?.[langCode]}/${subCategory.slug?.[langCode]}`;
        if (subSubCategory) canonical += `/${subSubCategory.slug?.[langCode]}`;

        // x-default (англійська версія)
        const enAlt = alternates.find((a) => a.hreflang === 'en');
        if (enAlt) {
            alternates.push({ hreflang: 'x-default', href: enAlt.href });
        }

        res.json({
            products: productsWithDetails,
            totalProducts,
            category: {
                _id: category._id,
                name: category.name?.[langCode] || category.name?.[fallbackCode] || '',
                slug: category.slug?.[langCode] || category.slug?.[fallbackCode] || '',
            },
            subCategory: {
                _id: subCategory._id,
                name: subCategory.name?.[langCode] || subCategory.name?.[fallbackCode] || '',
                slug: subCategory.slug?.[langCode] || subCategory.slug?.[fallbackCode] || '',
                meta: {
                    title: subCategory.meta?.title?.[langCode] || subCategory.meta?.title?.[fallbackCode] || '',
                    description: subCategory.meta?.description?.[langCode] || subCategory.meta?.description?.[fallbackCode] || '',
                    keywords: subCategory.meta?.keywords?.[langCode] || subCategory.meta?.keywords?.[fallbackCode] || '',
                },
            },
            subSubCategory: subSubCategory
                ? {
                      _id: subSubCategory._id,
                      name: subSubCategory.name?.[langCode] || subSubCategory.name?.[fallbackCode] || '',
                      slug: subSubCategory.slug?.[langCode] || subSubCategory.slug?.[fallbackCode] || '',
                      meta: {
                          title: subSubCategory.meta?.title?.[langCode] || subSubCategory.meta?.title?.[fallbackCode] || '',
                          description: subSubCategory.meta?.description?.[langCode] || subSubCategory.meta?.description?.[fallbackCode] || '',
                          keywords: subSubCategory.meta?.keywords?.[langCode] || subSubCategory.meta?.keywords?.[fallbackCode] || '',
                      },
                  }
                : null,
            pagination: {
                page: pageNum,
                pageSize,
            },
            seo: {
                canonical,
                alternates,
            },
        });
    } catch (error) {
        console.error('getAllProducts error:', error);
        res.status(500).json({ success: false, error });
    }
};

// Отримуємо один товар за id, враховуючи мову та fallback-мову
export const clientGetOne = async (req, res) => {
    try {
        const { slug } = req.params;
        const { lang, currency } = req.query;

        const currencyCode = (currency || 'USD').toUpperCase();
        const fallbackLang = 'US';

        // 1. Отримуємо всі мови для hreflang (urlCode і code)
        const allLanguages = await Language.find({}, { code: 1, urlCode: 1 }).lean();
        const currentLang = await Language.findOne({ urlCode: lang });
        if (!currentLang) {
            return res.status(400).json({ success: false, message: 'Language not found' });
        }
        const { code, urlCode } = currentLang;

        // 2. Отримуємо продукт
        let product = await Product.findOne(
            { [`slug.${code}`]: slug },
            {
                _id: 1,
                [`name.${code}`]: 1,
                [`description.${code}`]: 1,
                [`name.${fallbackLang}`]: 1,
                [`description.${fallbackLang}`]: 1,
                active: 1,
                availability: 1,
                part_number: 1,
                category: 1,
                price: 1,
                parameters: 1,
                keywords: 1,
                images: 1,
                sku: 1,
                slug: 1,
            },
        ).populate('availability');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const isLangAvailable = product.name?.[code] && product.description?.[code];
        const localizedName = isLangAvailable ? product.name?.[code] : product.name?.[fallbackLang] || '';
        const localizedDescription = isLangAvailable ? product.description?.[code] : product.description?.[fallbackLang] || '';

        const images = (product.images || []).map((image) => ({
            alt: image.originalname,
            large: normalizeImageUrl(image.path),
            small: normalizeSmallImageUrl(image.path),
        }));

        const availability = {
            title: product.availability?.title?.[code] || '',
            color: product.availability?.color || '',
        };

        // === Параметри, рейтинг і ціна залишаємо як було ===

        const productSKUs =
            product.parameters
                ?.flatMap((param) => param.list || [])
                .filter((item) => !!item.productSKU)
                .map((item) => item.productSKU) || [];

        const relatedProducts = await Product.find(
            { sku: { $in: productSKUs } },
            { sku: 1, [`slug.${code}`]: 1, [`slug.${fallbackLang}`]: 1 },
        ).lean();

        const skuToSlugMap = Object.fromEntries(relatedProducts.map((item) => [item.sku, item.slug?.[code] || item.slug?.[fallbackLang] || '']));

        const transformedParameters = (product.parameters || []).map((param) => ({
            name: param.name?.[code] || param.name?.[fallbackLang] || '',
            visible: param.visible || {},
            list: (param.list || []).map((item) => {
                const slug = item.productSKU && skuToSlugMap[item.productSKU] ? skuToSlugMap[item.productSKU] : '';
                return {
                    title: item.title,
                    slug,
                    active: item.active || false,
                };
            }),
        }));

        const productId = product._id;
        const totalReviews = await Reviews.countDocuments({ product: productId });
        const reviews = await Reviews.find({ product: productId }, 'rate');
        const totalRateSum = reviews.reduce((sum, review) => sum + review.rate, 0);
        const averageRate = totalReviews > 0 ? Number((totalRateSum / totalReviews).toFixed(1)) : 0;

        let finalPrice = product.price;
        let finalCurrencySymbol = '';
        const currencyLang = await Language.findOne({ currency: currencyCode });
        if (currencyCode !== 'USD') {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await axios.get(`https://minfin.com.ua/api/coin/day/usd/${currencyCode.toLowerCase()}/${today}`);
                const { course } = response.data.data[0];
                finalPrice = +(product.price * Number(course)).toFixed(2);
                finalCurrencySymbol = currencyLang?.currencySymbol || '$';
            } catch (e) {
                console.error('⚠️ Помилка отримання курсу валюти:', e.message);
                finalPrice = product.price;
                finalCurrencySymbol = '$';
            }
        } else {
            finalCurrencySymbol = currencyLang?.currencySymbol || '$';
        }

        const category = await Category.findById(product.category[0], { [`name.${code}`]: 1, [`slug.${code}`]: 1 });
        const sub_category = await SubCategory.findById(product.category[1], { [`name.${code}`]: 1, [`slug.${code}`]: 1 });
        const sub_sub_category = await SubSubCategory.findById(product.category[2], { [`name.${code}`]: 1, [`slug.${code}`]: 1 });

        // === ⭐ Додаємо seoLinks ===
        const seoLinks = Object.entries(product.slug || {})
            .map(([langCode, slugValue]) => {
                const langObj = allLanguages.find((l) => l.code === langCode);
                if (!langObj) return null;
                return {
                    hreflang: langObj.urlCode,
                    href: `https://alistar.ltd/${langObj.urlCode}/product/${slugValue}`,
                };
            })
            .filter(Boolean);

        // canonical = поточна сторінка
        const canonical = `https://alistar.ltd/${urlCode}/product/${product.slug?.[code]}`;

        // === ✅ Відповідь ===
        res.json({
            success: true,
            product: {
                _id: product._id,
                name: localizedName,
                description: localizedDescription,
                slug: product.slug?.[code] || product.slug?.[fallbackLang],
                sku: product.sku,
                active: product.active,
                part_number: product.part_number,
                category: {
                    name: category?.name?.[code] || category?.name?.[fallbackLang],
                    slug: category?.slug?.[code] || category?.slug?.[fallbackLang],
                },
                sub_category: {
                    name: sub_category?.name?.[code] || sub_category?.name?.[fallbackLang],
                    slug: sub_category?.slug?.[code] || sub_category?.slug?.[fallbackLang],
                },
                sub_sub_category: {
                    name: sub_sub_category?.name?.[code] || sub_sub_category?.name?.[fallbackLang],
                    slug: sub_sub_category?.slug?.[code] || sub_sub_category?.slug?.[fallbackLang],
                },
                price: finalPrice,
                defaultPrice: product.price,
                currencySymbol: finalCurrencySymbol,
                currencyCode: currencyCode,
                availability,
                images,
                parameters: transformedParameters,
                keywords: product.keywords,
                seo: {
                    canonical,
                    alternates: seoLinks,
                },
            },
            rate: averageRate,
            totalReviews,
        });
    } catch (error) {
        console.error('clientGetOne error:', error);
        res.status(500).json({ success: false, error });
    }
};

// При зміні мови на клієнті, отримуємо новий slug для товару, кожен товар має slug для кожної мови
export const getSlugByLang = async (req, res) => {
    try {
        const { currentSlug, currentLang, targetLang } = req.body;

        if (!currentSlug || !currentLang || !targetLang) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Отримуємо внутрішні коди мов (наприклад: UA, EN)
        const currentLangDoc = await Language.findOne({ urlCode: currentLang });
        const targetLangDoc = await Language.findOne({ urlCode: targetLang });

        if (!currentLangDoc || !targetLangDoc) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        const currentLangCode = currentLangDoc.code;
        const targetLangCode = targetLangDoc.code;

        // Шукаємо продукт по слагу поточної мови
        const product = await Product.findOne({ [`slug.${currentLangCode}`]: currentSlug });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const newSlug = product.slug?.[targetLangCode];

        if (!newSlug) {
            return res.status(404).json({ success: false, message: 'Slug for target language not found' });
        }

        return res.status(200).json({ success: true, newSlug });
    } catch (error) {
        console.error('getSlugByLang error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
