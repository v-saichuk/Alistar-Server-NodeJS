import { validationResult } from 'express-validator';
import Category from '../../models/Categories/Categories.js';
import SubCategories from '../../models/Categories/SubCategories.js';
import SubSubCategories from '../../models/Categories/SubSubCategories.js';
import Product from '../../models/Product.js';
import Language from '../../models/Language.js';
import transliteration from 'transliteration';

export const getAll = async (req, res) => {
    try {
        const allCategories = await Category.find();
        const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);

        const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id, productCount]));

        res.json(
            allCategories.map((category) => ({
                ...category._doc,
                productCount: productCountMap[category._id] || 0,
            })),
        );
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось отримати категорії!',
            err,
        });
    }
};

// ==== CREATE ====
const createGenerateUniqueCategorySlug = async (lang, baseSlug, categoryId = null) => {
    let slug = baseSlug;
    let counter = 1;

    const slugExists = async (slugToCheck) => {
        const categoryExists = await Category.findOne({
            [`slug.${lang}`]: slugToCheck,
            ...(categoryId ? { _id: { $ne: categoryId } } : {}),
        });

        return !!categoryExists;
    };

    while (await slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const slugs = {};
        for (let lang in req.body.name) {
            const name = req.body.name[lang];
            if (name) {
                try {
                    const baseSlug = transliteration.slugify(name.toLowerCase());
                    const uniqueSlug = await createGenerateUniqueCategorySlug(lang, baseSlug);
                    slugs[lang] = uniqueSlug;
                } catch (e) {
                    console.error(`Помилка при генерації slug для мови ${lang}:`, e);
                }
            }
        }

        const category = new Category({
            ...req.body,
            slug: slugs,
        });

        await category.save();

        res.json({
            category,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при створенні категорії!',
            err,
        });
    }
};
// ==== ./CREATE ====

// ==== UPDATE ====
const updateGenerateUniqueCategorySlug = async (lang, baseSlug, categoryId) => {
    let slug = baseSlug;
    let counter = 1;

    while (
        await Category.findOne({
            [`slug.${lang}`]: slug,
            _id: { $ne: categoryId },
        })
    ) {
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
};

const filterObj = (obj = {}) => Object.fromEntries(Object.entries(obj).filter(([k]) => typeof k === 'string' && !k.startsWith('$')));

export const update = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors.array());

        const { id: categoryId, name = {}, ...rest } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Категорію не знайдено!' });
        }

        const currentName = filterObj(category.name);
        const currentSlug = filterObj(category.slug);
        const updatedName = { ...currentName, ...filterObj(name) };
        const updatedSlug = { ...currentSlug };

        for (const lang of Object.keys(updatedName)) {
            const newName = updatedName[lang]?.trim();
            const oldName = currentName[lang]?.trim();
            const oldSlug = currentSlug[lang];

            if (!newName) continue;

            const nameChanged = newName !== oldName;
            const slugMissing = !oldSlug;

            if (nameChanged || slugMissing) {
                const baseSlug = transliteration.slugify(newName.toLowerCase());
                const finalSlug = await updateGenerateUniqueCategorySlug(lang, baseSlug, categoryId);
                updatedSlug[lang] = finalSlug;
            }
        }

        await Category.updateOne(
            { _id: categoryId },
            {
                $set: {
                    ...rest,
                    name: updatedName,
                    slug: updatedSlug,
                },
            },
        );

        const updatedCategory = await Category.findById(categoryId);
        res.json({ success: true, category: updatedCategory });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось оновити категорію!',
            error: err.message,
        });
    }
};
// ==== ./UPDATE ====

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Категорію не знайдено!',
            });
        }
        res.json({
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

// Client

export const clientGetNavigations = async (req, res) => {
    try {
        const { lang } = req.query;

        // Отримуємо код мови
        const language = await Language.findOne({ urlCode: lang });
        if (!language) {
            return res.status(400).json({ success: false, message: 'Невірна мова' });
        }

        const { code } = language;
        // Отримуємо категорії з бази даних
        const categories = await Category.find();
        const subCategories = await SubCategories.find();
        const subSubCategories = await SubSubCategories.find();

        // Кількість товарів в категорії
        // const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);

        // Мапа для швидкого доступу
        // const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id.toString(), productCount]));

        // Повертаємо категорії з локалізованим ім’ям
        const localizedCategories = categories.map((category) => ({
            _id: category._id,
            name: category.name?.[code] || '', // або резервна мова
            slug: category.slug?.[code] || '',
            icon: category.icon || '',
            // productCount: productCountMap[category._id.toString()] || 0,
        }));
        // Повертаємо підкатегорії з локалізованим ім’ям
        const localizedSubCategories = subCategories.map((sub) => ({
            _id: sub._id,
            parentId: sub.parentId,
            name: sub.name?.[code] || '', // або резервна мова
            slug: sub.slug?.[code] || '',
            icon: sub.icon || '',
            // productCount: productCountMap[category._id.toString()] || 0,
        }));
        // Повертаємо підпідкатегорії з локалізованим ім’ям
        const localizedSubSubCategories = subSubCategories.map((subSub) => ({
            _id: subSub._id,
            parentId: subSub.parentId,
            name: subSub.name?.[code] || '', // або резервна мова
            slug: subSub.slug?.[code] || '',
            icon: subSub.icon || '',
            // productCount: productCountMap[category._id.toString()] || 0,
        }));

        res.json({
            success: true,
            categories: localizedCategories,
            sub_categories: localizedSubCategories,
            sub_sub_categories: localizedSubSubCategories,
        });
    } catch (err) {
        console.error('Помилка:', err);
        res.status(500).json({
            success: false,
            message: 'Не вдалось отримати категорії!',
            err,
        });
    }
};

// Categories for client
export const clientGetCategory = async (req, res) => {
    try {
        const { lang } = req.query;
        const { slug } = req.params;

        const language = await Language.findOne({ urlCode: lang });
        if (!language) {
            return res.status(400).json({ success: false, message: 'Невірна мова' });
        }
        const { code, urlCode } = language;

        // Отримуємо список всіх мов
        const allLanguages = await Language.find({});
        // Беремо всі категорії по заданому слагу
        const categories = await Category.find({ [`slug.${code}`]: slug });
        if (!categories.length) {
            return res.status(404).json({ success: false, message: 'Категорія не знайдена' });
        }
        const mainCategory = categories[0];

        const sub_categories = await SubCategories.find({ parentId: mainCategory._id });
        const subCategoryIds = sub_categories.map((cat) => cat._id);
        const sub_sub_categories = await SubSubCategories.find({ parentId: { $in: subCategoryIds } });

        const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);
        const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id.toString(), productCount]));

        // --- SEO об'єкт для категорії ---
        // Створюємо масив усіх альтернатів
        const alternates = [];
        for (const l of allLanguages) {
            const lSlug = mainCategory.slug?.[l.code];
            if (lSlug) {
                alternates.push({
                    hreflang: l.urlCode.toLowerCase(), // ISO-код
                    href: `https://alistar.ltd/${l.urlCode.toLowerCase()}/catalog/${lSlug}`,
                });
            }
        }
        // Додаємо x-default (наприклад, EN)
        alternates.push({
            hreflang: 'x-default',
            href: `https://alistar.ltd/en/catalog/${mainCategory.slug?.['EN'] || mainCategory.slug?.['US']}`,
        });

        // Додаємо SEO до категорії
        const localizedCategories = categories.map((category) => ({
            _id: category._id,
            name: category.name?.[code] || '',
            slug: category.slug?.[code] || '',
            icon: category.icon || '',
            productCount: productCountMap[category._id.toString()] || 0,
            seo: {
                canonical: `https://alistar.ltd/${urlCode}/catalog/${category.slug?.[code] || ''}`,
                alternates,
            },
        }));

        const localizedSubCategories = sub_categories.map((sub) => {
            const subSub = sub_sub_categories
                .filter((ssc) => ssc.parentId.toString() === sub._id.toString())
                .map((ssc) => ({
                    _id: ssc._id,
                    name: ssc.name?.[code] || '',
                    slug: ssc.slug?.[code] || '',
                    icon: ssc.icon || '',
                    productCount: productCountMap[ssc._id.toString()] || 0,
                }));

            return {
                _id: sub._id,
                name: sub.name?.[code] || '',
                slug: sub.slug?.[code] || '',
                icon: sub.icon || '',
                productCount: productCountMap[sub._id.toString()] || 0,
                sub_sub_categories: subSub,
            };
        });

        res.json({
            success: true,
            categories: localizedCategories,
            sub_categories: localizedSubCategories,
        });
    } catch (err) {
        console.error('Помилка clientGetCategory:', err);
        res.status(500).json({
            success: false,
            message: 'Не вдалось отримати категорії!',
            err,
        });
    }
};

// При зміні мови на клієнті, отримуємо новий slug для товару, кожен товар має slug для кожної мови
export const getCategorySlugByLang = async (req, res) => {
    try {
        const { currentSlug, currentLang, targetLang } = req.body;

        if (!currentSlug || !currentLang || !targetLang) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Отримати коди мов (наприклад 'uk', 'en')
        const currentLangDoc = await Language.findOne({ urlCode: currentLang });
        const targetLangDoc = await Language.findOne({ urlCode: targetLang });

        if (!currentLangDoc || !targetLangDoc) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        const currentLangCode = currentLangDoc.code;
        const targetLangCode = targetLangDoc.code;

        // Розбити шлях на частини
        const segments = currentSlug.split('/');

        if (segments.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid slug' });
        }

        // Рівень 1: Category
        const mainCategory = await Category.findOne({ [`slug.${currentLangCode}`]: segments[0] });
        if (!mainCategory) {
            return res.status(404).json({ success: false, message: 'Main category not found' });
        }

        const slugParts = [mainCategory.slug?.[targetLangCode]];
        if (segments.length === 1) {
            return res.status(200).json({ success: true, newSlug: slugParts.join('/') });
        }

        // Рівень 2: SubCategory
        const subCategory = await SubCategories.findOne({
            [`slug.${currentLangCode}`]: segments[1],
            parent: mainCategory._id,
        });
        if (!subCategory) {
            return res.status(404).json({ success: false, message: 'Subcategory not found' });
        }

        slugParts.push(subCategory.slug?.[targetLangCode]);
        if (segments.length === 2) {
            return res.status(200).json({ success: true, newSlug: slugParts.join('/') });
        }

        // Рівень 3: SubSubCategory
        const subSubCategory = await SubSubCategories.findOne({
            [`slug.${currentLangCode}`]: segments[2],
            parent: subCategory._id,
        });
        if (!subSubCategory) {
            return res.status(404).json({ success: false, message: 'Sub-subcategory not found' });
        }

        slugParts.push(subSubCategory.slug?.[targetLangCode]);
        return res.status(200).json({ success: true, newSlug: slugParts.join('/') });
    } catch (error) {
        console.error('getCategorySlugByLang error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
