import axios from 'axios';
import Product from '../../models/Product.js';
import Reviews from '../../models/Reviews.js';
import Language from '../../models/Language.js';
import Category from '../../models/Categories/Categories.js';
import SubCategory from '../../models/Categories/SubCategories.js';
import SubSubCategory from '../../models/Categories/SubSubCategories.js';

// export const getFilters = async (req, res) => {
//     try {
//         let slugs = JSON.parse(req.query.categories); // масив slug-ів
//         const lang = req.query.lang;

//         const langDoc = await Language.findOne({ urlCode: lang });

//         slugs = slugs.filter(Boolean); // видаляємо null або undefined

//         // Отримуємо всі товари, які належать цим категоріям (по slug)
//         const categories = await Category.find({
//             [`slug.${langDoc.code}`]: { $in: slugs },
//         });

//         const categoryIds = categories.map((cat) => cat._id).toString();

//         const products = await Product.find(
//             {
//                 category: { $all: categoryIds },
//             },
//             { parameters: 1 },
//         );

//         const parameters = [];

//         products.forEach((product) => {
//             product.parameters.forEach((param) => {
//                 if (param?.visible?.filter) {
//                     const paramName = param.name[langDoc.code];
//                     if (paramName) {
//                         let existingParam = parameters.find((p) => p.name === paramName);
//                         if (!existingParam) {
//                             existingParam = { name: paramName, params: new Set() };
//                             parameters.push(existingParam);
//                         }
//                         param.list.forEach((item) => {
//                             existingParam.params.add(item.title);
//                         });
//                     }
//                 }
//             });
//         });

//         const parametrs = parameters.map((param) => ({
//             label: param.name,
//             title: param.name,
//             options: Array.from(param.params).map((el) => ({
//                 label: el,
//                 value: el,
//             })),
//         }));

//         res.json({ parametrs });
//     } catch (error) {
//         console.error('Error in getFilters:', error);
//         res.status(500).json({ success: false, error });
//     }
// };

// Отримуємо фільтри для товарів з бази даних

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
                // Змінюємо базовий шлях
                const replaceImageHost = (url) => {
                    if (!url) return '';
                    return url.replace('https://server.alistar.ltd/upload/', 'https://alistar.ltd/image/');
                };

                const images = (product.images || []).map((image) => ({
                    alt: image.originalname,
                    large: replaceImageHost(image.path),
                    small: replaceImageHost(image.path).replace('/image/', '/image/small/'),
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
            },
            subSubCategory: subSubCategory
                ? {
                      _id: subSubCategory._id,
                      name: subSubCategory.name?.[langCode] || subSubCategory.name?.[fallbackCode] || '',
                      slug: subSubCategory.slug?.[langCode] || subSubCategory.slug?.[fallbackCode] || '',
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

// export const getAllProducts = async (req, res) => {
//     try {
//         // const { categorySlug, subCategorySlug } = req.params;
//         const { categorySlug, subCategorySlug, subSubCategorySlug } = req.params;

//         const { lang, fallbackLang = 'en', page = 1, currency } = req.query;

//         // ⬇️ Обробка filters
//         let filters = {};
//         try {
//             if (req.query.filters) {
//                 filters = JSON.parse(req.query.filters);
//             }
//         } catch (e) {
//             console.warn('❌ Невірний формат filters:', req.query.filters);
//             filters = {};
//         }

//         const pageSize = 24;
//         const pageNum = Math.max(Number(page), 1);
//         const skip = (pageNum - 1) * pageSize;

//         const langDoc = await Language.findOne({ urlCode: lang });
//         const fallbackLangDoc = await Language.findOne({ urlCode: fallbackLang });

//         if (!langDoc || !fallbackLangDoc) {
//             return res.status(400).json({ success: false, message: 'Invalid language codes' });
//         }

//         const langCode = langDoc.code;
//         const fallbackCode = fallbackLangDoc.code;

//         // ⬇️ Категорії по slug
//         const category =
//             (await Category.findOne({ [`slug.${langCode}`]: categorySlug })) || (await Category.findOne({ [`slug.${fallbackCode}`]: categorySlug }));

//         if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

//         const subCategory =
//             (await SubCategory.findOne({ [`slug.${langCode}`]: subCategorySlug })) ||
//             (await SubCategory.findOne({ [`slug.${fallbackCode}`]: subCategorySlug }));

//         if (!subCategory) return res.status(404).json({ success: false, message: 'SubCategory not found' });

//         const subSubCategory = await SubSubCategory.find({ parentId: subCategory._id }).select([`name.${langCode}`, `name.${fallbackCode}`]);

//         // ⬇️ Валюта
//         let exchangeRate = 1;
//         let currencyCode = 'USD';
//         let currencySymbol = '$';

//         if (currency) {
//             const currencyLangDoc = await Language.findOne({ currency: currency.toUpperCase() });
//             if (currencyLangDoc) {
//                 currencyCode = currencyLangDoc.currency.toUpperCase();
//                 currencySymbol = currencyLangDoc.currencySymbol;
//             }
//         }

//         if (currencyCode !== 'USD') {
//             try {
//                 const today = new Date().toISOString().split('T')[0];
//                 const response = await axios.get(`https://minfin.com.ua/api/coin/day/usd/${currencyCode.toLowerCase()}/${today}`);
//                 exchangeRate = Number(response.data.data[0].course) || 1;
//             } catch (e) {
//                 console.error('⚠️ Помилка курсу валюти:', e.message);
//                 exchangeRate = 1;
//                 currencySymbol = '$';
//             }
//         }

//         // ⬇️ Побудова основного query
//         const query = {
//             active: true,
//             category: { $all: [category._id.toString(), subCategory._id.toString()] },
//         };

//         // ⬇️ Додавання параметрів фільтрів
//         if (Object.keys(filters).length > 0) {
//             query.parameters = {
//                 $all: Object.entries(filters).map(([paramName, values]) => ({
//                     $elemMatch: {
//                         [`name.${langCode}`]: paramName,
//                         list: {
//                             $elemMatch: {
//                                 title: { $in: values },
//                             },
//                         },
//                     },
//                 })),
//             };
//         }

//         const totalProducts = await Product.countDocuments(query);

//         const products = await Product.find(query, {
//             [`name.${langCode}`]: 1,
//             [`name.${fallbackCode}`]: 1,
//             price: 1,
//             images: 1,
//             slug: 1,
//         })
//             .skip(skip)
//             .limit(pageSize)
//             .select('-description');

//         const productsWithDetails = await Promise.all(
//             products.map(async (product) => {
//                 const totalReviews = await Reviews.countDocuments({ product: product._id });
//                 const reviews = await Reviews.find({ product: product._id }, 'rate');
//                 const totalRateSum = reviews.reduce((sum, review) => sum + review.rate, 0);
//                 const averageRate = totalReviews > 0 ? Number((totalRateSum / totalReviews).toFixed(1)) : 0;

//                 const name = product.name?.[langCode] || product.name?.[fallbackCode] || '';
//                 const image = product.images?.[0] || null;

//                 const images = (product.images || []).map((image) => ({
//                     alt: image.originalname,
//                     large: image.path,
//                     small: image.path.replace('/upload/', '/upload/small/'),
//                 }));

//                 return {
//                     _id: product._id,
//                     slug: product.slug?.[langCode] || product.slug?.[fallbackCode] || '',
//                     name,
//                     price: +(product.price * exchangeRate).toFixed(2),
//                     defaultPrice: product.price,
//                     currency: currencySymbol,
//                     image: images?.[0],
//                     averageRate,
//                     totalReviews,
//                 };
//             }),
//         );

//         res.json({
//             products: productsWithDetails,
//             totalProducts,
//             category: {
//                 _id: category._id,
//                 name: category.name?.[langCode] || category.name?.[fallbackCode] || '',
//                 slug: category.slug?.[langCode] || category.slug?.[fallbackCode] || '',
//             },
//             subCategory: {
//                 _id: subCategory._id,
//                 name: subCategory.name?.[langCode] || subCategory.name?.[fallbackCode] || '',
//                 slug: subCategory.slug?.[langCode] || subCategory.slug?.[fallbackCode] || '',
//                 description: subSubCategory.map((s) => s.name?.[langCode] || s.name?.[fallbackCode] || '').join(', '),
//             },
//             pagination: {
//                 page: pageNum,
//                 pageSize,
//             },
//         });
//     } catch (error) {
//         console.error('getAllProducts error:', error);
//         res.status(500).json({ success: false, error });
//     }
// };

// Oтримуємо всі товари з бази даних, фільтруємо за категоріями та параметрами
export const OLDgetAllProducts = async (req, res) => {
    try {
        const { categorySlug, subCategorySlug } = req.params;
        const { lang, fallbackLang = 'en' } = req.query;

        let categories = JSON.parse(req.query.categories);
        const { page, pageSize } = req.query.paginations;

        // Отримуємо параметри для фільтрації з запиту
        const filterParameters = req.query.parameters;

        // Побудуйте об'єкт запиту для фільтрації
        const query = { active: true }; // Додаємо фільтр для `active: true`

        // Фільтрація за категоріями
        if (categories && categories.length > 0) {
            categories = categories.filter((category) => category !== null);

            if (categories.length > 0) {
                query.category = { $all: categories };
            }
        }

        // Фільтрація за параметрами (враховуємо лише активні параметри)
        if (filterParameters && Object.keys(filterParameters).length > 0) {
            query['parameters'] = {
                $all: Object.entries(filterParameters).map(([paramName, values]) => ({
                    $elemMatch: {
                        [`name.${lang}`]: paramName,
                        list: { $elemMatch: { title: { $in: values }, active: true } },
                    },
                })),
            };
        }

        // Підрахунок загальної кількості продуктів з урахуванням фільтрів
        const totalProducts = await Product.countDocuments(query);

        const skip = (page - 1) * pageSize;
        const products = await Product.find(query, {
            [`name.${lang}`]: 1,
            [`name.${fallbackLang}`]: 1,
            price: 1,
            images: 1,
        })
            .skip(skip)
            .limit(pageSize)
            .select('-description');

        // Додаємо до кожного продукту рейтинг, кількість відгуків та обробляємо назви
        const productsWithDetails = await Promise.all(
            products.map(async (product) => {
                const totalReviews = await Reviews.countDocuments({ product: product._id });
                const reviews = await Reviews.find({ product: product._id }, 'rate');
                const totalRateSum = reviews.reduce((sum, review) => sum + review.rate, 0);
                const averageRate = totalReviews > 0 ? Number((totalRateSum / totalReviews).toFixed(1)) : 0;

                // Перевіряємо, чи є текст для обраної мови
                const isLangAvailable = product.name?.[lang];
                const name = isLangAvailable ? product.name[lang] : product.name[fallbackLang]; // Використовуємо fallback мову

                // Вибираємо лише перше зображення
                const images = [product.images?.[0] || null];

                return {
                    ...product._doc, // Перетворюємо Mongoose документ у звичайний об'єкт
                    name, // Назва в форматі рядка
                    totalReviews,
                    averageRate,
                    images,
                };
            }),
        );

        res.json({ products: productsWithDetails, totalProducts });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// Отримуємо товари які додані в кошик, оновлюємо їх за id та повертаємо
export const getProductsByIds = async (req, res) => {
    try {
        const { ids, lang } = req.body; // Отримуємо масив id і мову з параметрів запиту
        const fallbackLang = 'UA'; // Мова за замовчуванням

        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Не передано жодного id.' });
        }

        // Перетворюємо строку id в масив, якщо передано строку
        const productIds = Array.isArray(ids) ? ids : JSON.parse(ids);

        // Отримуємо товари за id, основну інформацію та обрану мову
        let products = await Product.find(
            {
                _id: { $in: productIds },
            },
            {
                [`name.${lang}`]: 1,
                [`name.${fallbackLang}`]: 1,
                price: 1,
                images: 1,
                sku: 1,
            },
        ).select('-description');

        // Обробка мовного fallback, форматування назви та вибір першого зображення
        products = products.map((product) => {
            const productObject = product.toObject();
            const name = productObject.name?.[lang] || productObject.name?.[fallbackLang] || '';
            const images = [productObject.images?.[0] || null]; // Вибираємо лише перше зображення

            return {
                ...productObject,
                name,
                images,
            };
        });

        res.json({ success: true, products });
    } catch (error) {
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

        // Змінюємо базовий шлях
        const replaceImageHost = (url) => {
            if (!url) return '';
            return url.replace('https://server.alistar.ltd/upload/', 'https://alistar.ltd/image/');
        };

        const images = (product.images || []).map((image) => ({
            alt: image.originalname,
            large: replaceImageHost(image.path),
            small: replaceImageHost(image.path).replace('/image/', '/image/small/'),
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
