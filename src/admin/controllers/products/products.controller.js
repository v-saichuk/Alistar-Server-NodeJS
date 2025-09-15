import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import js2xmlparser from 'js2xmlparser';
import { validationResult } from 'express-validator';
import transliteration from 'transliteration';
import { slugify } from 'transliteration';
import Reviews from '../../../shared/models/Reviews.js';
import Redirect from '../../../shared/models/Redirect.js';
import Product from '../../../shared/models/Product.js';
import ProductSettings from '../../../shared/models/Products.settings.js';

// HELPERS
import '../../helpers/autoAddProducts.js';
import '../../helpers/analyzeProductSKUs.js';
import '../../helpers/updateNameProduct.js';
import '../../helpers/parseFiberMall.js';
// ./HELPERS

// http://localhost:8282/api/get-products?page=1&pageSize=10 - параметр запит

export const apiGetProductsAdmin = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, filters } = req.body;

        // Побудуйте об'єкт запиту для фільтрації
        const query = {};

        if (filters.availability && filters.availability.length > 0) {
            query.availability = { $in: filters.availability };
        }

        if (filters.category && filters.category.length > 0) {
            query.category = { $elemMatch: { $in: filters.category } };
        }

        // Фільтрація по параметрам з перевіркою на active
        if (filters) {
            const parameterFilters = [];

            Object.keys(filters).forEach((key) => {
                // Ігноруємо фільтри, значення яких null або порожні масиви
                if (filters[key] !== null && filters[key].length > 0) {
                    if (key !== 'availability' && key !== 'category') {
                        parameterFilters.push({
                            parameters: {
                                $elemMatch: {
                                    ['name.US']: key,
                                    list: {
                                        $elemMatch: {
                                            title: { $in: filters[key] },
                                            active: true, // фільтруємо тільки ті параметри, які мають active: true
                                        },
                                    },
                                },
                            },
                        });
                    }
                }
            });

            if (parameterFilters.length > 0) {
                query.$and = parameterFilters;
            }
        }

        // Підрахуйте загальну кількість продуктів з урахуванням фільтрів
        const totalProducts = await Product.countDocuments(query);

        const skip = (page - 1) * pageSize;
        const productsRaw = await Product.find(query, {
            [`name.US`]: 1,
            [`slug.US`]: 1,
            active: 1,
            availability: 1,
            part_number: 1,
            category: 1,
            price: 1,
            images: 1,
            sku: 1,
            updatedAt: 1,
            createdAt: 1,
        })
            .populate('availability')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('-description')
            .lean();

        const products = productsRaw.map((product) => {
            const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
            const largePath = firstImage?.path || '';
            const smallPath = typeof largePath === 'string' ? largePath.replace('/upload/', '/upload/small/') : undefined;

            return {
                ...product,
                name: product?.name?.US || '',
                slug: product?.slug?.US || '',
                images: {
                    large: largePath,
                    small: smallPath,
                    originalname: firstImage?.originalname || '',
                },
            };
        });

        res.json({ products, totalProducts });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

export const getOne = async (req, res) => {
    try {
        const { id: PRODUCT_PAGE_ID } = req.params;

        // Знайти продукт за його ID
        const product = await Product.findById({ _id: PRODUCT_PAGE_ID });

        // Отримати загальну кількість відгуків
        const totalReviews = await Reviews.countDocuments({ product: PRODUCT_PAGE_ID });

        // Отримати всі оцінки (rate) для цього продукту
        const reviews = await Reviews.find({ product: PRODUCT_PAGE_ID }, 'rate');

        // Обчислити суму всіх оцінок
        const totalRateSum = reviews.reduce((sum, review) => sum + review.rate, 0);

        // Обчислити середню оцінку (загальний рейтинг) та округлити до найближчого цілого числа
        const averageRate = totalReviews > 0 ? Math.round(totalRateSum / totalReviews) : 0;

        // Отримати всі унікальні ключові слова з усіх товарів
        const allKeywordsResult = await Product.aggregate([
            { $unwind: '$keywords' }, // Розгорнути масив ключових слів
            { $group: { _id: '$keywords' } }, // Групувати за ключовим словом
            { $group: { _id: null, allKeywords: { $addToSet: '$_id' } } }, // Зібрати унікальні ключові слова
            { $project: { _id: 0, allKeywords: 1 } }, // Відобразити лише allKeywords без _id
        ]);

        // Витягти allKeywords з результату агрегації
        const allKeywords = allKeywordsResult[0]?.allKeywords || [];

        // Відправити відповідь з даними
        res.json({ success: true, product, rate: averageRate, totalReviews, allKeywords });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// ===== CREATE PRODUCT =====
// Функція генерації унікального слага
const generateUniqueSlug = async (lang, baseSlug, productId = null) => {
    let slug = baseSlug;
    let counter = 1;

    const slugExists = async (slugToCheck) => {
        const productExists = await Product.findOne({
            [`slug.${lang}`]: slugToCheck,
            ...(productId ? { _id: { $ne: productId } } : {}),
        });

        const redirectExists = await Redirect.findOne({
            from: `/${lang}/${slugToCheck}`,
        });

        return !!productExists || !!redirectExists;
    };

    while (await slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

export const create = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }

    try {
        const slugs = {};
        // Генерація унікального слага для кожної мови
        for (let lang in req.body.name) {
            const name = req.body.name[lang];

            if (name) {
                const baseSlug = transliteration.slugify(name.toLowerCase());
                const uniqueSlug = await generateUniqueSlug(lang, baseSlug);
                slugs[lang] = uniqueSlug;
            }
        }

        const product = new Product({
            ...req.body,
            slug: slugs,
            parameters: req.body.parameters || [],
        });

        const savedProduct = await product.save();
        const data = await Product.findById(savedProduct._id);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// ===== ./CREATE PRODUCT =====

// ===== UPDATE PRODUCT =====

const createRedirectIfSlugChanged = async (lang, oldSlug, newSlug, productId) => {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return newSlug;

    let finalSlug = newSlug;
    const baseSlug = newSlug;
    let counter = 1;

    // Перевірка наявності слага у товарах та редіректах
    while (
        (await Product.findOne({
            [`slug.${lang}`]: finalSlug,
            _id: { $ne: productId },
        })) ||
        (await Redirect.findOne({
            to: `/${lang}/${finalSlug}`,
            productId: { $ne: productId },
        }))
    ) {
        finalSlug = `${baseSlug}-${counter++}`;
    }

    const from = `/${lang}/${oldSlug}`;
    const to = `/${lang}/${finalSlug}`;

    const existingRedirect = await Redirect.findOne({ productId });

    if (existingRedirect) {
        if (existingRedirect.from === from && existingRedirect.to === to) return finalSlug;

        await Redirect.updateOne({ _id: existingRedirect._id }, { $set: { from, to, updatedAt: new Date() } });
    } else {
        await Redirect.create({ from, to, type: 301, productId });
    }

    return finalSlug;
};

export const update = async (req, res) => {
    try {
        const { id: PRODUCT_PAGE_ID } = req.params;
        const existingProduct = await Product.findById(PRODUCT_PAGE_ID);

        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const updatedName = {
            ...existingProduct.name,
            ...req.body.name,
        };

        const updatedDescription = {
            ...existingProduct.description,
            ...req.body.description,
        };

        const updatedSlug = { ...existingProduct.slug };

        // Генерація slug для мов, які з'явилися
        for (const lang in updatedName) {
            const newName = updatedName[lang];
            const currentName = existingProduct.name?.[lang];
            const currentSlug = existingProduct.slug?.[lang];

            if (!newName) continue;

            const baseSlug = slugify(newName.toLowerCase());

            // Умова: або новий заголовок змінився, або слаг взагалі відсутній
            const shouldGenerateNewSlug = newName !== currentName || !currentSlug;

            if (!shouldGenerateNewSlug) continue;

            const finalSlug = await createRedirectIfSlugChanged(lang, currentSlug, baseSlug, PRODUCT_PAGE_ID);

            // Записуємо лише якщо дійсно щось нове
            if (finalSlug !== currentSlug) {
                updatedSlug[lang] = finalSlug;
            }
        }

        const updatedParameters = req?.body?.parameters
            ? req.body.parameters.map((param, index) => ({
                  ...(existingProduct.parameters?.[index] || {}),
                  ...param,
              }))
            : existingProduct.parameters;

        const updatedProductData = {
            ...existingProduct._doc,
            ...req.body,
            name: updatedName,
            description: updatedDescription,
            slug: updatedSlug,
            parameters: updatedParameters,
        };

        await Product.updateOne({ _id: PRODUCT_PAGE_ID }, updatedProductData);

        const updatedProduct = await Product.findById(PRODUCT_PAGE_ID);
        res.json({ success: true, data: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const { id: PRODUCT_PAGE_ID } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(PRODUCT_PAGE_ID);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Товар не знайдено!',
            });
        }

        const totalProductsCountd = await Product.countDocuments();
        res.json({ success: true, total: totalProductsCountd });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

export const duplicateProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        // Знаходимо товар
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Товар не знайдено!' });
        }

        // Дублюємо товар
        const duplicatedProduct = new Product({
            ...product.toObject(),
            name: {
                UA: product.name?.UA ? `(copy) ${product.name.UA}` : '(copy)',
            },
            description: {
                UA: '',
            },
            sku: Date.now(), // Генеруємо унікальний артикул
            _id: undefined, // Генерується автоматично
            createdAt: undefined, // Очищаємо дату створення
            updatedAt: undefined, // Очищаємо дату оновлення
        });

        // Зберігаємо дубльований товар
        const savedProduct = await duplicatedProduct.save();

        // Відправляємо відповідь із новим ідентифікатором товару
        res.json({ success: true, newProduct: savedProduct._id });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
    }
};

export const groupUpdate = async (req, res) => {
    try {
        const PRODUCT_ID = req.body.productId;
        const { action, page = 1, pageSize = 10 } = req.body; // Додаємо пагінацію

        switch (action) {
            case 'Edit_price':
                const { valuePrice } = req.body; // Отримуємо нову ціну з тіла запиту

                if (!valuePrice) {
                    return res.status(400).json({ success: false, message: 'Нова ціна не вказана' });
                }

                for (const productId of PRODUCT_ID) {
                    try {
                        const product = await Product.findById(productId);
                        if (!product) {
                            console.error(`Product with ID ${productId} not found`);
                            continue;
                        }

                        // Оновлюємо лише поле ціни
                        await Product.updateOne({ _id: productId }, { $set: { price: valuePrice } });
                    } catch (error) {
                        console.error(`Error updating price for product with ID ${productId}: ${error.message}`);
                    }
                }
                break;

            case 'Duplicate':
                const duplicatedIds = [];

                for (const productId of PRODUCT_ID) {
                    try {
                        const product = await Product.findById(productId);
                        if (!product) {
                            continue;
                        }

                        const duplicatedProduct = new Product({
                            ...product.toObject(),
                            name: {
                                UA: product.name?.UA ? `(copy) ${product.name.UA}` : '(copy)',
                            },
                            description: {
                                UA: '',
                            },
                            sku: Date.now(), // Генеруємо унікальний артикул
                            _id: undefined, // Генерується автоматично
                            createdAt: undefined, // Очищаємо дату створення
                            updatedAt: undefined, // Очищаємо дату оновлення
                        });

                        const savedProduct = await duplicatedProduct.save();
                        duplicatedIds.push(savedProduct._id);
                    } catch (error) {
                        console.error(`Error duplicating product with ID ${productId}: ${error.message}`);
                    }
                }
                break;

            case 'Delete':
                await Product.deleteMany({ _id: { $in: PRODUCT_ID } });
                break;

            default:
                return res.status(400).json({ success: false, message: 'Невідома дія' });
        }

        // Після дублювання чи видалення, завантажуємо продукти для поточної сторінки
        const skip = (page - 1) * pageSize;

        const products = await Product.find(
            {},
            {
                [`name.UA`]: 1,
                active: 1,
                availability: 1,
                part_number: 1,
                category: 1,
                price: 1,
                parameters: 1,
                images: 1,
                sku: 1,
                updatedAt: 1,
                createdAt: 1,
            },
        )
            .populate('availability')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('-description');

        const totalProductsCount = await Product.countDocuments();

        res.json({ success: true, products, total: totalProductsCount });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
    }
};

// Функція експортування та імпортування даних в Excel
// export const exportExcelData = async (req, res) => {
//     try {
//         const { format, language, fields, category, sub_category } = req.body;

//         const escapeRegExps = (value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

//         let filter = {};
//         if (category) {
//             filter.category = { $in: category };
//         }

//         const andSubCategoryConditions = [];
//         for (const [categoryId, subCategoryNames] of Object.entries(sub_category)) {
//             const subCategoryConditions = subCategoryNames.map((name) => ({
//                 [`sub_categories.${categoryId}.${language}`]: { $regex: new RegExp(`^${escapeRegExps(name)}$`, 'i') },
//             }));
//             andSubCategoryConditions.push({ $or: subCategoryConditions });
//         }
//         if (andSubCategoryConditions.length > 0) {
//             filter.$and = andSubCategoryConditions;
//         }

//         const products = await Product.find(filter).sort({ _id: -1 });
//         const productSettings = await ProductSettings.findOne();

//         const getCategory = (categoryId) => {
//             const categoryItem = productSettings.categories.find((cat) => cat._id.toString() === categoryId);
//             return categoryItem ? categoryItem.name[language] : 'Невідома категорія';
//         };

//         const getStatus = (statusId) => {
//             const statusItem = productSettings.status.find((status) => status._id.toString() === statusId);
//             return statusItem ? statusItem.title[language] : 'Невідомий статус';
//         };

//         const subCategoryHeaders = productSettings.categories
//             .flatMap((cat) => cat.content)
//             .reduce((acc, subCat) => {
//                 acc[subCat.name[language]] = '';
//                 return acc;
//             }, {});

//         const getSubCategories = (product) => {
//             const subCategoryData = { ...subCategoryHeaders }; // Start with empty values for all sub-categories
//             Object.entries(product.sub_categories).forEach(([categoryId, details]) => {
//                 const subCategory = productSettings.categories.flatMap((cat) => cat.content).find((sub) => sub._id.toString() === categoryId);
//                 if (subCategory) {
//                     subCategoryData[subCategory.name[language]] = details[language].join(', ');
//                 }
//             });
//             return subCategoryData;
//         };

//         const getBrand = (product, language) => {
//             const brandCategoryName = 'Виробник';
//             const brands = productSettings.categories.flatMap((cat) => cat.content).filter((subCat) => subCat.name[language] === brandCategoryName);
//             const brandValues = brands.flatMap((subCategory) => {
//                 // Перевіряємо, чи існує підкатегорія в продукті
//                 if (product.sub_categories[subCategory._id.toString()]) {
//                     // Видаляємо пусті значення і об'єднуємо їх
//                     return product.sub_categories[subCategory._id.toString()][language]
//                         .filter((value) => value.trim() !== '') // Видаляємо пусті рядки
//                         .map((value) => value.trim()); // Обрізаємо зайві пробіли
//                 }
//                 return []; // Повертаємо порожній масив для пустих підкатегорій
//             });

//             return brandValues.length && brandValues.join(', ');
//         };

//         const uploadsDir = path.join(process.cwd(), 'uploads');
//         if (!fs.existsSync(uploadsDir)) {
//             fs.mkdirSync(uploadsDir, { recursive: true });
//         }

//         const filePath = path.join(uploadsDir, `products.${format}`);

//         if (format === 'xlsx') {
//             const wb = XLSX.utils.book_new();
//             const data = products.map((product) => {
//                 let productData = {
//                     _id: product._id.toString(),
//                 };

//                 if (fields.includes('name')) {
//                     productData.name = product.name?.[language];
//                 }
//                 if (fields.includes('status')) {
//                     productData.status = getStatus(product.status);
//                 }
//                 if (fields.includes('sku')) {
//                     productData.sku = product.sku;
//                 }
//                 if (fields.includes('ean')) {
//                     productData.ean = product.ean;
//                 }
//                 if (fields.includes('price')) {
//                     productData.price = product.price?.[language];
//                 }
//                 if (fields.includes('gpl_price')) {
//                     productData.gpl_price = product.gpl_price?.[language];
//                 }
//                 if (fields.includes('delivery_time')) {
//                     productData.delivery_time = product.delivery_time?.[language];
//                 }
//                 if (fields.includes('short_description')) {
//                     productData.short_description = product.short_description?.[language];
//                 }
//                 if (fields.includes('long_description')) {
//                     productData.long_description = product.long_description?.[language];
//                 }
//                 productData.category = getCategory(product.category);
//                 productData = { ...productData, ...getSubCategories(product) };

//                 if (fields.includes('product_url')) {
//                     productData.product_url = `https://brandonly.net/product/${product._id?.toString()}`;
//                 }
//                 if (fields.includes('product_image')) {
//                     productData.product_image = product?.gallery?.[0]?.path;
//                 }

//                 return productData;
//             });

//             const ws = XLSX.utils.json_to_sheet(data);
//             XLSX.utils.book_append_sheet(wb, ws, language);
//             XLSX.writeFile(wb, filePath);
//         } else if (format === 'xml') {
//             const dataXml = products.map((product) => {
//                 let productData = {
//                     id: product._id.toString(),
//                 };

//                 if (fields.includes('name')) {
//                     productData.title = product.name[language];
//                 }

//                 productData.brand = getBrand(product, language); // Додавання "Brand" згідно з "Тип модуля"

//                 if (fields.includes('status')) {
//                     productData.availability = getStatus(product.status) === 'В наявності' ? 'in_stock' : 'out_of_stock';
//                 }

//                 productData.condition = 'new'; // Стан завжди новий

//                 if (fields.includes('sku')) {
//                     productData.mpn = product.sku;
//                 }
//                 if (fields.includes('ean')) {
//                     productData.ean = product.ean;
//                 }
//                 if (fields.includes('price')) {
//                     productData.price = product.price?.[language];
//                 }
//                 if (fields.includes('gpl_price')) {
//                     productData.gpl_price = product.gpl_price?.[language];
//                 }
//                 if (fields.includes('short_description')) {
//                     productData.short_description = product.short_description?.[language];
//                 }
//                 if (fields.includes('long_description')) {
//                     productData.description = product.long_description?.[language];
//                 }
//                 if (fields.includes('product_url')) {
//                     productData.link = `https://brandonly.net/product/${product._id?.toString()}`;
//                 }
//                 if (fields.includes('product_image')) {
//                     productData.image_link = product?.gallery?.[0]?.path;
//                 }

//                 return productData;
//             });

//             const xmlData = js2xmlparser.parse('products', dataXml);
//             fs.writeFileSync(filePath, xmlData);
//         }

//         res.download(filePath, `products.${format}`, (err) => {
//             fs.unlink(filePath, (unlinkErr) => {
//                 if (unlinkErr) {
//                     console.error('Failed to delete file:', unlinkErr);
//                 } else {
//                     console.log('File deleted');
//                 }
//             });

//             if (err) {
//                 console.error('Error sending file:', err);
//                 if (!res.headersSent) {
//                     res.status(500).send('Помилка при відправці файлу.');
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error processing request:', error);
//         res.status(500).json({ success: false, error: error.message || 'Помилка обробки запиту' });
//     }
// };

// export const importExcelData = async (filePath) => {
//     const workbook = XLSX.readFile(filePath);
//     const firstSheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[firstSheetName];
//     const rawData = XLSX.utils.sheet_to_json(worksheet);

//     const productSettings = await ProductSettings.findOne();
//     const categories = productSettings.categories;
//     const statuses = productSettings.status;

//     // Створення мапи для категорій і підкатегорій
//     const categoryMap = categories.reduce((acc, cat) => {
//         acc[cat.name[firstSheetName]] = {
//             id: cat._id.toString(),
//             subCategories: cat.content.reduce((subAcc, subCat) => {
//                 subAcc[subCat.name[firstSheetName]] = subCat._id.toString();
//                 return subAcc;
//             }, {}),
//         };
//         return acc;
//     }, {});

//     // Створення мапи для статусів
//     const statusMap = statuses.reduce((acc, status) => {
//         acc[status.title[firstSheetName]] = status._id.toString();
//         return acc;
//     }, {});

//     const updatedResults = [];

//     // Перетворення даних з Excel і оновлення/створення в базі даних
//     for (const product of rawData) {
//         let productData = {};

//         if (product.name) productData.name = { [firstSheetName]: product.name };
//         if (product.status) productData.status = statusMap[product.status];
//         if (product.sku) productData.sku = product.sku;
//         if (product.ean) productData.ean = product.ean;
//         if (product.price) productData.price = { [firstSheetName]: product.price };
//         if (product.gpl_price) productData.gpl_price = { [firstSheetName]: product.gpl_price };
//         if (product.delivery_time) productData.delivery_time = { [firstSheetName]: product.delivery_time };
//         if (product.short_description) productData.short_description = { [firstSheetName]: product.short_description };
//         if (product.long_description) productData.long_description = { [firstSheetName]: product.long_description };
//         if (product.category) productData.category = categoryMap[product.category]?.id;

//         productData.sub_categories = {};
//         Object.keys(categoryMap[product.category]?.subCategories || {}).forEach((subCatName) => {
//             if (product[subCatName]) {
//                 // Розділяємо значення розділені комою і видаляємо пробіли на початку та кінці кожного значення
//                 const subCategoryValues = product[subCatName].split(',').map((value) => value.trim());
//                 productData.sub_categories[categoryMap[product.category].subCategories[subCatName]] = { [firstSheetName]: subCategoryValues };
//             }
//         });

//         const productId = product._id || new mongoose.Types.ObjectId();
//         const updateResult = await Product.updateOne({ _id: productId }, { $set: productData }, { upsert: true });
//         updatedResults.push(updateResult);
//     }

//     return { count: updatedResults.length, updatedResults };
// };

// Перевіряємо, чи існує товар з таким SKU
export const checkSkuExists = async (req, res) => {
    try {
        const { sku } = req.params;

        const productExists = await Product.exists({ sku });

        if (productExists) {
            return res.json({ success: true, message: 'Такий товар вже існує' });
        }

        res.json({ success: false, message: 'Товара з таким SKU не існує' });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};

// ==========
// Отримуємо параметри для фільтрів
export const parameters = async (req, res) => {
    try {
        // const { lang } = req.query; // Отримуємо мову з запиту, наприклад ?lang=UA
        // Перевіряємо, чи передано параметр мови
        // if (!lang) {
        //     return res.status(400).json({ error: 'Language parameter is required' });
        // }
        // Отримуємо всі товари
        // const products = await Product.find({});
        const products = await Product.find();

        // Масив для зберігання унікальних значень параметрів
        const parameters = [];

        // Проходимо через всі товари та збираємо унікальні значення параметрів
        products.forEach((product) => {
            // console.log('product.parameters =>', product.parameters);
            product.parameters.forEach((param) => {
                // Перевіряємо, чи параметр повинен відображатися у фільтрах
                if (param?.visible?.filter) {
                    const paramName = param.name.UA; // Використовуємо динамічну мову
                    if (paramName) {
                        // Знаходимо або створюємо фільтр для даного параметра
                        let existingParam = parameters.find((p) => p.name === paramName);

                        if (!existingParam) {
                            existingParam = { name: paramName, params: new Set() };
                            parameters.push(existingParam);
                        }

                        // Додаємо тільки активні значення в Set
                        // Переконуємося, що `param.list` є масивом
                        if (Array.isArray(param.list)) {
                            param.list.forEach((item) => {
                                if (item?.title) {
                                    existingParam.params.add(item.title);
                                }
                            });
                        } else {
                            console.log('param.list не є масивом або відсутній:', param.list); // Лог, якщо `param.list` не існує або не є масивом
                        }
                    }
                }
            });
        });

        console.log('parameters');

        // Конвертуємо Set в масив та підготовлюємо фінальний результат
        const result = parameters.map((param) => ({
            label: param.name,
            title: param.name,
            options: Array.from(param.params).map((el) => ({ label: el, value: el })),
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
};

// ====== UPDATE TRANSLATE =======
const updateProductTranslationsDirectly = async (productId) => {
    try {
        // Зазначаємо переклади, які потрібно додати
        const translations = {
            AL: 'Kompatibil',
            AT: 'Kompatibel',
            BG: 'Съвместим',
            CZ: 'Kompatibilní',
            DE: 'Kompatibel',
            DK: 'Kompatibel',
            EE: 'Ühildatav',
            ES: 'Compatible',
            FI: 'Yhteensopiva',
            FR: 'Compatible',
            GR: 'Συμβατό',
            HR: 'Kompatibilan',
            HU: 'Kompatibilis',
            IE: 'Comhoiriúnach',
            IS: 'Samhæft',
            IT: 'Compatibile',
            LT: 'Suderinamas',
            LU: 'Kompatibel',
            LV: 'Saderīgs',
            MK: 'Компјутерски',
            MT: 'Kompatibbli',
            NL: 'Compatibel',
            NO: 'Kompatibel',
            PL: 'Kompatybilny',
            PT: 'Compatível',
            RO: 'Compatibil',
            RS: 'Компатибилан',
            RU: 'Совместимый',
            SE: 'Kompatibel',
            SK: 'Kompatibilný',
            UA: 'Сумісність',
            US: 'Compatible',
        };

        // const translations = {
        //     AL: 'Lloji i Ndërfaqes',
        //     AT: 'Transceiver-Typ',
        //     BG: 'Тип на предавателя',
        //     CZ: 'Typ vysílače',
        //     DE: 'Transceiver-Typ',
        //     DK: 'Transceivertype',
        //     EE: 'Saatjatüüp',
        //     ES: 'Tipo de transceptor',
        //     FI: 'Lähetinvastaanotintyyppi',
        //     FR: 'Type de transceiver',
        //     GR: 'Τύπος πομποδέκτη',
        //     HR: 'Vrsta prijemnika',
        //     HU: 'Adó-vevő típus',
        //     IE: 'Cineál Trasfhoilsitheora',
        //     IS: 'Gagnasendi gerð',
        //     IT: 'Tipo di ricetrasmettitore',
        //     LT: 'Siųstuvo tipas',
        //     LU: 'Transceiver-Typ',
        //     LV: 'Raidītāja tips',
        //     MK: 'Тип на трансивер',
        //     MT: 'Tip ta Transceiver',
        //     NL: 'Type transceiver',
        //     NO: 'Transceivertype',
        //     PL: 'Typ transceivera',
        //     PT: 'Tipo de transceptor',
        //     RO: 'Tip transceiver',
        //     RS: 'Тип трансивера',
        //     RU: 'Тип трансивера',
        //     SE: 'Transceivertyp',
        //     SK: 'Typ transceivera',
        //     UA: 'Тип трансивера',
        //     US: 'Transceiver Type',
        // };

        // Отримуємо існуючий документ товару за його ID
        const existingProduct = await Product.findById(productId);

        if (!existingProduct) {
            console.log('Product not found');
            return;
        }

        // Оновлюємо лише ті параметри, де name.US === 'Compatible'
        const updatedParameters = existingProduct.parameters.map((param) => {
            if (param.name && param.name.US === 'Compatible') {
                // if (param.name && param.name.US === 'Transceiver Type') {
                return {
                    ...param,
                    name: {
                        ...param.name,
                        ...translations, // Додаємо всі переклади
                    },
                };
            }
            return param;
        });

        // Створюємо оновлений об'єкт товару з оновленими перекладами
        const updatedProductData = {
            ...existingProduct._doc,
            parameters: updatedParameters,
        };

        // Оновлюємо товар у базі даних
        await Product.updateOne({ _id: productId }, updatedProductData);

        console.log(`Product ${productId} updated successfully`);
    } catch (error) {
        console.error(`Error updating product: ${error.message}`);
    }
};

// Приклад виклику функції для одного товару
// updateProductTranslationsDirectly('66d5d7a0b131f200bd617a11'); // Замініть 'ID_ТОВАРУ' на фактичний ID товару

//  Шукаємо по всім товарам параметр який заданий, якщо знаходимо його, то заміняємо весь обьєкт перекладом.
const updateAllCompatibleProducts = async () => {
    try {
        // Переклади

        const translations = {
            AL: 'Llojet',
            AT: 'Typen',
            BG: 'Типове',
            CZ: 'Typy',
            DE: 'Typen',
            DK: 'Typer',
            EE: 'Tüübid',
            ES: 'Tipos',
            FI: 'Tyypit',
            FR: 'Types',
            GR: 'Τύποι',
            HR: 'Tipovi',
            HU: 'Típusok',
            IE: 'Types',
            IS: 'Gerðir',
            IT: 'Tipi',
            LT: 'Tipai',
            LU: 'Typen',
            LV: 'Veidi',
            MK: 'Типови',
            MT: 'Tipi',
            NL: 'Typen',
            NO: 'Typer',
            PL: 'Typy',
            PT: 'Tipos',
            RO: 'Tipuri',
            RS: 'Типови',
            RU: 'Типы',
            SE: 'Typer',
            SK: 'Typy',
            UA: 'Типи',
            US: 'Types',
        };

        const translateAndActivate = 'Types';

        // Крок 1: Оновлення перекладів у масиві `parameters`
        const updateTranslations = await Product.updateMany(
            { 'parameters.name.UA': translateAndActivate },
            {
                $set: { 'parameters.$[param].name': translations },
            },
            {
                arrayFilters: [{ 'param.name.UA': translateAndActivate }], // Фільтр для масиву `parameters`
            },
        );

        console.log(`Updated ${updateTranslations.modifiedCount} products with translations`);

        // Крок 2: Оновлення поля `visible` в елементах масиву `parameters`
        const updateVisibility = await Product.updateMany(
            { 'parameters.name.US': translateAndActivate },
            {
                $set: { 'parameters.$[param].visible.product': true }, // Оновлюємо поле visible.product в елементах масиву
            },
            {
                arrayFilters: [{ 'param.name.US': translateAndActivate }], // Фільтр для масиву `parameters`
            },
        );

        console.log(`Updated visibility for ${updateVisibility.modifiedCount} products`);
    } catch (error) {
        console.error(`Error updating products: ${error.message}`);
    }
};

// Виклик функції для масового оновлення
// updateAllCompatibleProducts();

// Отримуємо всі параметри з товарів які немають переклада.
// Робимо перевірку по всім мовам, якщо хоч на одну мову не доданий переклад, значить параметр рахуєме як без переклада
const getUniqueParameterNamesWithSKUs = async () => {
    try {
        // Список мов, для яких необхідно перевірити переклади
        const requiredLanguages = [
            'AL',
            'AT',
            'BG',
            'CZ',
            'DE',
            'DK',
            'EE',
            'ES',
            'FI',
            'FR',
            'GR',
            'HR',
            'HU',
            'IE',
            'IS',
            'IT',
            'LT',
            'LU',
            'LV',
            'MK',
            'MT',
            'NL',
            'NO',
            'PL',
            'PT',
            'RO',
            'RS',
            'RU',
            'SE',
            'SK',
            'UA',
            'US',
        ];

        // Агрегуємо по всіх товарах
        const result = await Product.aggregate([
            {
                $unwind: '$parameters', // Розкриваємо масив параметрів для кожного товару
            },
            {
                $match: { 'parameters.name': { $exists: true, $ne: null } }, // Фільтруємо тільки параметри, де є name
            },
            {
                $addFields: {
                    missingTranslations: {
                        $filter: {
                            input: requiredLanguages,
                            as: 'lang',
                            cond: {
                                $not: {
                                    $in: [
                                        '$$lang',
                                        {
                                            $cond: {
                                                if: { $isArray: { $objectToArray: '$parameters.name' } },
                                                then: { $map: { input: { $objectToArray: '$parameters.name' }, as: 'item', in: '$$item.k' } },
                                                else: [],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $match: { 'missingTranslations.0': { $exists: true } }, // Залишаємо тільки ті параметри, де є відсутні переклади
            },
            {
                $group: {
                    _id: '$parameters.name.UA', // Групуємо за унікальним значенням 'parameters.name.UA'
                    count: { $sum: 1 }, // Підраховуємо кількість товарів для кожного унікального параметра
                    skus: { $addToSet: '$sku' }, // Додаємо всі унікальні sku для кожного параметра
                },
            },
            {
                $sort: { count: -1 }, // Сортуємо за кількістю товарів у спадаючому порядку
            },
        ]);

        // Форматуємо результат у вигляді об'єкта
        const uniqueParameters = result.reduce((acc, item) => {
            acc[item._id] = {
                count: item.count,
                skus: item.skus, // Зберігаємо масив sku для кожного параметра
            };
            return acc;
        }, {});

        // Виводимо знайдені унікальні параметри з кількістю та sku
        console.log('Unique parameters, their counts, and SKUs:');
        for (const [parameter, data] of Object.entries(uniqueParameters)) {
            console.log(`${parameter}: ${data.count}`);
            console.log(`SKUs: ${data.skus.join(', ')}`);
        }
    } catch (error) {
        console.error(`Error getting unique parameters with SKUs: ${error.message}`);
    }
};

// getUniqueParameterNamesWithSKUs();

// ./Отримуємо всі параметри з товарів:

// ========== Оновлення заголовка та описа ==========

const updateProductTranslationsById = async (productId) => {
    try {
        // Визначаємо переклади для назви та опису

        const translations = {
            AL: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP në 2x400G OSFP PAM4 InfiniBand NDR Kabllo e Drejtpërdrejtë e Pasme, Krye të Sheshtë në një fund dhe Krye të Sheshtë në fundin tjetër',
            AT: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP zu 2x400G OSFP PAM4 InfiniBand NDR Passive Direktangeschlossene Kabel, Flachkopf an einem Ende und Flachkopf am anderen Ende',
            BG: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP към 2x400G OSFP PAM4 InfiniBand NDR Пассивен директно свързан кабел, Плосък край на единия край и плосък край на другия',
            CZ: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP na 2x400G OSFP PAM4 InfiniBand NDR Pasivní přímě připojený kabel, Plochý konec na jednom konci a plochý konec na druhém',
            DE: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP auf 2x400G OSFP PAM4 InfiniBand NDR Passives Direkt angeschlossenes Kabel, Flachkopf an einem Ende und Flachkopf am anderen Ende',
            DK: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP til 2x400G OSFP PAM4 InfiniBand NDR Passiv Direkte Tilsluttet Kabel, Flad top i den ene ende og Flad top i den anden ende',
            EE: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP 2x400G OSFP PAM4 InfiniBand NDR Passiivne Otseselt Ühendatud Kaabel, Lamepea ühes otsas ja lamepea teises otsas',
            ES: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP a 2x400G OSFP PAM4 InfiniBand NDR Cable Directo Pasivo, Parte Superior Plana en un extremo y Parte Superior Plana en el otro',
            FI: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP:stä 2x400G OSFP PAM4 InfiniBand NDR Passiivinen Suoraan Liitetty Kaapeli, Tasainen pää yhdessä päässä ja Tasainen pää toisessa päässä',
            FR: "OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP à 2x400G OSFP PAM4 InfiniBand NDR Câble Passif Directement Connecté, Extrémité Plate à une extrémité et Extrémité Plate à l'autre",
            GR: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP σε 2x400G OSFP PAM4 InfiniBand NDR Παθητικό Άμεσο Συνδεδεμένο Καλώδιο, Ίσιο άκρο σε μία άκρη και ίσιο άκρο στην άλλη',
            HR: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP do 2x400G OSFP PAM4 InfiniBand NDR Pasivni Direktno Povezani Kabel, Ravan vrh na jednom kraju i Ravan vrh na drugom kraju',
            HU: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP 2x400G OSFP PAM4 InfiniBand NDR Passzív Közvetlen Csatlakoztatott Kábel, Lapos vég az egyik végén és Lapos vég a másik végén',
            IE: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP go 2x400G OSFP PAM4 InfiniBand NDR Cábla Ceangailte Dídine, Barr Flat ar aon cheann agus Barr Flat ar an gceann eile',
            IS: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP í 2x400G OSFP PAM4 InfiniBand NDR Passive Beintengdur Snúning, Flat topp á einum enda og Flat topp á hinum endanum',
            IT: "OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP a 2x400G OSFP PAM4 InfiniBand NDR Cavo Direttamente Connesso Passivo, Estremità Piatta a un Estremo e Estremità Piatta all'altro",
            LT: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP iki 2x400G OSFP PAM4 InfiniBand NDR Pasivus Tiesiogiai Prijungtas Kabelis, Plokščias galas viename gale ir Plokščias galas kitame gale',
            LU: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP an 2x400G OSFP PAM4 InfiniBand NDR Passiv Direkt Ugeschloss Kabel, Flatt Spëtzt op enger Säit an Flatt Spëtzt op der anerer',
            LV: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP uz 2x400G OSFP PAM4 InfiniBand NDR Pasīvs Tieši Pievienots Kabelis, Līdzens gals vienā galā un Līdzens gals otrā galā',
            MK: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP до 2x400G OSFP PAM4 InfiniBand NDR Пассивен Директно Поврзан Кабел, Раван крај на еден крај и Раван крај на другиот крај',
            MT: "OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP għal 2x400G OSFP PAM4 InfiniBand NDR Kabel Dirett Passiv, Taħt Pjan fl-aħħar ta' waħda u Taħt Pjan fl-aħħar ta' l-oħra",
            NL: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP naar 2x400G OSFP PAM4 InfiniBand NDR Passieve Direct Aangesloten Kabel, Vlakke Top aan de ene kant en Vlakke Top aan de andere kant',
            NO: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP til 2x400G OSFP PAM4 InfiniBand NDR Passiv Direkte Tilkoblede Kabel, Flat topp i den ene enden og Flat topp i den andre enden',
            PL: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP do 2x400G OSFP PAM4 InfiniBand NDR Pasywne Kabel Bezpośrednio Podłączone, Płaska końcówka na jednym końcu i Płaska końcówka na drugim końcu',
            PT: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP para 2x400G OSFP PAM4 InfiniBand NDR Cabo Direto Passivo Conectado, Topo Plano em uma Extremidade e Topo Plano na Outra',
            RO: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP la 2x400G OSFP PAM4 InfiniBand NDR Cablu Pasiv Conectat Direct, Cap Plat la o extremitate și Cap Plat la cealaltă',
            RS: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP do 2x400G OSFP PAM4 InfiniBand NDR Pasivno Direktno Povezan Kabl, Ravan kraj na jednom kraju i Ravan kraj na drugom kraju',
            RU: 'OSFP-FLT-800G-PC2M 2м (7футов) 2x400G OSFP к 2x400G OSFP PAM4 InfiniBand NDR Пассивный Кабель Прямого Подключения, Плоский конец на одном конце и Плоский конец на другом',
            SE: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP till 2x400G OSFP PAM4 InfiniBand NDR Passiv Direkt Ansluten Kabel, Platt topp i ena änden och Platt topp i den andra änden',
            SK: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP na 2x400G OSFP PAM4 InfiniBand NDR Pasívny Priamo Pripojený Kábel, Ploché konce na oboch koncoch',
            UA: 'OSFP-FLT-800G-PC2M 2м (7футів) 2x400G OSFP до 2x400G OSFP PAM4 InfiniBand NDR Пасивний Директно Підключений Кабель, Плоский кінець на одному кінці і Плоский кінець на іншому',
            US: 'OSFP-FLT-800G-PC2M 2m (7ft) 2x400G OSFP to 2x400G OSFP PAM4 InfiniBand NDR Passive Direct Attached Cable, Flat top on one end and Flat top on the other',
        };

        // Знаходимо товар за ID та оновлюємо поля name та description
        const result = await Product.updateOne(
            { _id: productId },
            {
                $set: {
                    name: translations,
                    // description: descriptionTranslations,
                },
            },
        );

        if (result.modifiedCount === 0) {
            console.log(`No changes were made. Product with id ${productId} not found or already updated.`);
        } else {
            console.log(`Product with id ${productId} successfully updated.`);
        }
    } catch (error) {
        console.error(`Error updating product: ${error.message}`);
    }
};

// Приклад виклику функції для оновлення товару за його ID
// updateProductTranslationsById('67293d4be296a276d80bd349'); // Замініть 'ID_ТОВАРУ' на фактичний ID товару

// ========== Оновлення заголовка та описа ==========

// Додавання параметрів
const addParameterToMultipleProductsBySku = async (skuArray, parameterName, parameterProperties) => {
    try {
        const notFoundSkus = []; // Масив для SKU, які не знайдені
        const alreadyExistingSkus = []; // Масив для SKU, у яких параметр уже існує

        for (const sku of skuArray) {
            // Знаходимо товар за SKU
            const product = await Product.findOne({ sku });

            if (!product) {
                notFoundSkus.push(sku);
                continue; // Пропускаємо до наступного SKU
            }

            // Перевіряємо, чи параметр уже існує
            const existingParameter = product.parameters.find((param) => param.name && param.name.UA === parameterName);

            if (existingParameter) {
                alreadyExistingSkus.push(sku);
                continue; // Пропускаємо до наступного SKU
            }

            // Додаємо новий параметр
            const newParameter = {
                visible: {
                    product: false,
                    filter: true,
                },
                name: {
                    UA: parameterName,
                },
                list: parameterProperties.list || [], // Використовуємо список, якщо він переданий
            };

            // Оновлюємо список параметрів
            product.parameters.push(newParameter);

            // Оновлюємо товар у базі даних
            await Product.updateOne({ _id: product._id }, { parameters: product.parameters });

            console.log(`Parameter "${parameterName}" added to product with SKU: ${sku}`);
        }

        // Логування результатів
        if (notFoundSkus.length > 0) {
            console.log(`Products not found for SKUs: ${notFoundSkus.join(', ')}`);
        }

        if (alreadyExistingSkus.length > 0) {
            console.log(`Parameter "${parameterName}" already exists for SKUs: ${alreadyExistingSkus.join(', ')}`);
        }

        return {
            notFoundSkus,
            alreadyExistingSkus,
        };
    } catch (error) {
        console.error(`Error updating products: ${error.message}`);
    }
};

// Виклик
const skuArray = ['20161']; // Список SKU
const parameterName = 'Transmission Mode';
const parameterProperties = {
    list: [{ title: 'BiDi', active: true }],
};

// addParameterToMultipleProductsBySku(skuArray, parameterName, parameterProperties).then((result) => {
//     console.log('Operation completed.');
//     console.log('Not found SKUs:', result.notFoundSkus);
//     console.log('Already existing SKUs:', result.alreadyExistingSkus);
// });

// ===== ОНОВЛЕННЯ НАЗВИ ТА ОПИСУ ТОВАРА ПО ID, ПОШУК СЛОВА ТА ЗАМІНА ЙОГО ====
export const updateNameProduct = async () => {
    try {
        // Знаходимо товар за ID
        const product = await Product.findById('6726af6ce296a276d80bcb03');

        if (!product) {
            console.log('Товар не знайдено');
            return;
        }

        // Функція для заміни слова в текстових полях
        const replaceFiberMall = (text) => {
            if (!text) return text; // Перевірка на наявність тексту
            return text.replace(/Fiber\s?Mall/gi, 'Alistar'); // Замінюємо "FiberMall" або "Fiber Mall" незалежно від регістру
        };

        // Оновлюємо багатомовні та інші текстові поля
        const updatedFields = {};

        for (const [key, value] of Object.entries(product._doc)) {
            if (typeof value === 'string') {
                // Якщо значення — строка, просто замінюємо
                updatedFields[key] = replaceFiberMall(value);
            } else if (typeof value === 'object' && value !== null) {
                // Якщо значення — об'єкт (наприклад, багатомовний), перевіряємо кожну мову
                const updatedObject = {};
                let hasChanges = false;

                for (const [langKey, langValue] of Object.entries(value)) {
                    if (typeof langValue === 'string') {
                        const updatedValue = replaceFiberMall(langValue);
                        updatedObject[langKey] = updatedValue;

                        if (updatedValue !== langValue) {
                            hasChanges = true;
                        }
                    } else {
                        updatedObject[langKey] = langValue; // Залишаємо незмінним, якщо це не строка
                    }
                }

                if (hasChanges) {
                    updatedFields[key] = updatedObject;
                }
            }
        }

        // Оновлюємо тільки ті поля, які змінилися
        if (Object.keys(updatedFields).length > 0) {
            await Product.updateOne({ _id: '6726af6ce296a276d80bcb03' }, { $set: updatedFields });
            console.log('Назви товару оновлено:', updatedFields);
        } else {
            console.log('Змін у товарі не знайдено');
        }
    } catch (error) {
        console.error('Помилка сервера:', error);
    }
};

// Викликаємо функцію
// updateNameProduct();
// ===== ./ОНОВЛЕННЯ НАЗВИ ТА ОПИСУ ТОВАРА ПО ID, ПОШУК СЛОВА ТА ЗАМІНА ЙОГО ====

// ===== ОНОВЛЕННЯ НАЗВИ ТА ОПИСУ ВСІХ ТОВАРІВ , ПОШУК СЛОВА ТА ЗАМІНА ЙОГО ====
export const updateAllNameProduct = async () => {
    try {
        console.log('Start updating all products...');
        // Знаходимо всі товари в базі
        const products = await Product.find();

        if (!products || products.length === 0) {
            console.log('Жодного товару не знайдено');
            return;
        }

        let updatedCount = 0;
        const updatedProductIds = [];

        for (const product of products) {
            const updatedFields = {};

            // Функція для заміни слова в текстових полях
            const replaceFiberMall = (text) => {
                if (!text) return text; // Перевірка на наявність тексту
                return text.replace(/Fiber\s?Mall/gi, 'Alistar'); // Замінюємо "FiberMall" або "Fiber Mall" незалежно від регістру
            };

            for (const [key, value] of Object.entries(product._doc)) {
                if (typeof value === 'string') {
                    updatedFields[key] = replaceFiberMall(value);
                } else if (typeof value === 'object' && value !== null) {
                    const updatedObject = {};
                    let hasChanges = false;

                    for (const [langKey, langValue] of Object.entries(value)) {
                        if (typeof langValue === 'string') {
                            const updatedValue = replaceFiberMall(langValue);
                            updatedObject[langKey] = updatedValue;

                            if (updatedValue !== langValue) {
                                hasChanges = true;
                            }
                        } else {
                            updatedObject[langKey] = langValue; // Залишаємо незмінним, якщо це не строка
                        }
                    }

                    if (hasChanges) {
                        updatedFields[key] = updatedObject;
                    }
                }
            }

            // Оновлюємо тільки ті товари, у яких є зміни
            if (Object.keys(updatedFields).length > 0) {
                await Product.updateOne({ _id: product._id }, { $set: updatedFields });
                updatedCount++;
                updatedProductIds.push(product._id.toString());
            }
        }

        console.log(`Кількість оновлених товарів: ${updatedCount}`);
        if (!!updatedProductIds.length) {
            console.log('Жоден товар не був оновлений');
        }
    } catch (error) {
        console.error('Помилка сервера:', error);
    }
};

// updateAllNameProduct(); // Викликаємо функцію
// ===== ./ОНОВЛЕННЯ НАЗВИ ТА ОПИСУ ВСІХ ТОВАРІВ , ПОШУК СЛОВА ТА ЗАМІНА ЙОГО ====

// ПОШУК В ПАРАМЕРАХ СЛОВА ТА ЗАМІНА ТЕКСТА ГЛОБАЛЬНО
export const updateNameProductForAll = async () => {
    console.log('Start updating products...');
    try {
        // Знаходимо всі товари, де слово "FiberMall" або "Fiber Mall" присутнє у параметрах
        const products = await Product.find({
            'parameters.list.title': { $regex: /Fiber\s?Mall/i },
        });

        if (!products || products.length === 0) {
            console.log('Жодного товару для оновлення не знайдено');
            return;
        }

        let updatedCount = 0;
        const updatedProductIds = [];

        for (const product of products) {
            // Функція для заміни слова в текстових полях
            const replaceFiberMall = (text) => {
                if (!text) return text; // Перевірка на наявність тексту
                return text.replace(/Fiber\s?Mall/gi, 'Alistar'); // Замінюємо "FiberMall" або "Fiber Mall" незалежно від регістру
            };

            // Оновлюємо лише параметри
            const updatedParams = product.parameters.map((param) => {
                // Копіюємо параметри
                const updatedParam = { ...param };

                // Оновлюємо "list"
                if (Array.isArray(updatedParam.list)) {
                    updatedParam.list = updatedParam.list.map((item) => ({
                        ...item,
                        title: replaceFiberMall(item.title), // Замінюємо слово у "title"
                    }));
                }

                // Оновлюємо "name", якщо це багатомовний об'єкт
                if (updatedParam.name && typeof updatedParam.name === 'object') {
                    const updatedName = {};
                    for (const [langKey, langValue] of Object.entries(updatedParam.name)) {
                        updatedName[langKey] = replaceFiberMall(langValue); // Замінюємо слово в кожній мові
                    }
                    updatedParam.name = updatedName;
                }

                // Повертаємо оновлений параметр
                return updatedParam;
            });

            // Оновлюємо товар у базі
            await Product.updateOne({ _id: product._id }, { $set: { parameters: updatedParams } });
            updatedCount++;
            updatedProductIds.push(product._id.toString());
        }

        console.log(`Кількість оновлених товарів: ${updatedCount}`);
    } catch (error) {
        console.error('Помилка сервера:', error);
    }
};

// updateNameProductForAll(); // Викликаємо функцію
// ./ПОШУК В ПАРАМЕРАХ СЛОВА ТА ЗАМІНА ТЕКСТА ГЛОБАЛЬНО

// ===== СКОПІЮВАТИ ОПИС АНГЛІЙСЬКОЮ З UA ДО US, ЯКЩО US ПУСТИЙ =====
const fillEnglishDescriptionFromUA = async () => {
    try {
        console.log('Start filling English description from UA...');
        // Вибираємо тільки ті товари, де US опису немає, а UA існує
        const products = await Product.find(
            {
                $or: [{ 'description.US': { $exists: false } }, { 'description.US': '' }, { 'description.US': null }],
                'description.UA': { $exists: true, $ne: '' },
            },
            { sku: 1, description: 1, _id: 1 },
        );

        console.log(`Fetched ${products.length} products with empty US and non-empty UA description`);
        let updated = 0;
        let skippedNotEnglish = 0;
        let skippedNoUA = 0;
        let skippedOther = 0;
        const bulkOps = [];

        for (const product of products) {
            const uaText = product.description?.UA?.trim();
            if (!uaText) {
                skippedNoUA++;
                console.log(`[${product.sku}] Skipped: UA description is empty`);
                continue;
            }
            // Перевіряємо чи UA опис англійською (латиниця)
            if (/[a-zA-Z]/.test(uaText)) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: { $set: { 'description.US': uaText } },
                    },
                });
                updated++;
                console.log(`[${product.sku}] Will update: UA copied to US`);
            } else {
                skippedNotEnglish++;
                console.log(`[${product.sku}] Skipped: UA is not in English`);
            }
        }

        if (bulkOps.length > 0) {
            const result = await Product.bulkWrite(bulkOps);
            console.log(`Bulk update result:`, result.result || result);
        }

        console.log('Summary:');
        console.table([
            { Metric: 'Всього', Value: products.length },
            { Metric: 'Оновлено', Value: updated },
            { Metric: 'Пропущено (UA не англійською)', Value: skippedNotEnglish },
            { Metric: 'Пропущено (UA порожній)', Value: skippedNoUA },
            { Metric: 'Пропущено (інше)', Value: skippedOther },
        ]);
    } catch (error) {
        console.error('Error in fillEnglishDescriptionFromUA:', error);
    }
};

// fillEnglishDescriptionFromUA().catch(console.error);

// ===== ГЛОБАЛЬНЕ ЗНИЖЕННЯ ЦІНИ НА 15% ДЛЯ ВСІХ ТОВАРІВ (ПОШТУЧНО З ЛОГУВАННЯМ) =====
const decreaseAllPricesBy15Percent = async () => {
    try {
        const result = await Product.updateMany({ price: { $exists: true, $ne: null } }, [
            {
                $set: {
                    price: { $round: [{ $multiply: ['$price', 0.85] }, 2] },
                },
            },
        ]);
        console.log(`Оновлено: ${result.modifiedCount} товарів`);
    } catch (error) {
        console.error('Помилка при зниженні цін:', error);
    }
};
// ===== ./ГЛОБАЛЬНЕ ЗНИЖЕННЯ ЦІНИ НА 15% ДЛЯ ВСІХ ТОВАРІВ (ПОШТУЧНО З ЛОГУВАННЯМ) =====

// decreaseAllPricesBy15Percent();
