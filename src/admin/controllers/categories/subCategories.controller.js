import { validationResult } from 'express-validator';
import SubCategories from '../../../shared/models/Categories/SubCategories.js';
import SubSubCategories from '../../../shared/models/Categories/SubSubCategories.js';
import Product from '../../../shared/models/Product.js';
import transliteration from 'transliteration';

export const getAll = async (req, res) => {
    try {
        const sub_categories = await SubCategories.find().populate('parentId');
        const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);

        const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id, productCount]));

        res.json(
            sub_categories.map((sub_category) => ({
                ...sub_category._doc,
                productCount: productCountMap[sub_category._id] || 0,
            })),
        );
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось отримати sub_категорії!',
            err,
        });
    }
};

// ===== CREATE =====
const createGenerateUniqueSubCategorySlug = async (lang, baseSlug, subCategoryId = null) => {
    let slug = baseSlug;
    let counter = 1;

    const slugExists = async (slugToCheck) => {
        const subCategoryExists = await SubCategories.findOne({
            [`slug.${lang}`]: slugToCheck,
            ...(subCategoryId ? { _id: { $ne: subCategoryId } } : {}),
        });

        return !!subCategoryExists;
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
                    const uniqueSlug = await createGenerateUniqueSubCategorySlug(lang, baseSlug);
                    slugs[lang] = uniqueSlug;
                } catch (e) {
                    console.error(`Помилка при генерації slug для мови ${lang}:`, e);
                }
            }
        }

        const new_sub_category = new SubCategories({
            ...req.body,
            slug: slugs,
        });

        await new_sub_category.save();

        const sub_category = await SubCategories.findById(new_sub_category._id).populate('parentId').exec();

        res.json({
            sub_category,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при створенні субкатегорії!',
            err,
        });
    }
};
// ===== CREATE =====

// ===== UPDATE =====
const updateGenerateUniqueSubCategorySlug = async (lang, baseSlug, subCategoryId) => {
    let slug = baseSlug;
    let counter = 1;

    while (
        await SubCategories.findOne({
            [`slug.${lang}`]: slug,
            _id: { $ne: subCategoryId },
        })
    ) {
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
};

const filterObj = (obj = {}) => Object.fromEntries(Object.entries(obj).filter(([k]) => typeof k === 'string' && !k.startsWith('$')));

export const update = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const { id: subCategoryId, name = {}, ...rest } = req.body;
        const subCategory = await SubCategories.findById(subCategoryId);
        if (!subCategory) {
            return res.status(404).json({ success: false, message: 'Субкатегорію не знайдено!' });
        }

        const currentName = filterObj(subCategory.name);
        const currentSlug = filterObj(subCategory.slug);
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
                const finalSlug = await updateGenerateUniqueSubCategorySlug(lang, baseSlug, subCategoryId);
                updatedSlug[lang] = finalSlug;
            }
        }

        await SubCategories.updateOne(
            { _id: subCategoryId },
            {
                $set: {
                    ...rest,
                    name: updatedName,
                    slug: updatedSlug,
                },
            },
        );

        const updatedSubCategory = await SubCategories.findById(subCategoryId).populate('parentId');

        res.json({ success: true, sub_category: updatedSubCategory });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось оновити субкатегорію!',
            error: err.message,
        });
    }
};

// ===== ./UPDATE =====

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSubCategory = await SubCategories.findByIdAndDelete(id);

        if (!deletedSubCategory) {
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

// Функція для ручного оновлення перекладів
// export const updateCategoryTranslations = async (categoryId, translations) => {
//     try {
//         const sub_sub_category = await SubSubCategories.findOneAndUpdate({ _id: categoryId }, { name: translations }, { new: true });

//         if (!sub_sub_category) {
//             console.error('Категорію не знайдено!');
//             return;
//         }

//         console.log('Категорію успішно оновлено!');
//     } catch (err) {
//         console.error('Не вдалося оновити категорію!', err.message);
//     }
// };

// // Приклад виклику функції
// const categoryId = '66d0989fc49916488935e4c4'; // ID категорії
// const translations = {
//     UA: 'Модулі оптичного петлі',
//     US: 'Fiber Loopback Modules',
//     PT: 'Módulos de Loopback de Fibra',
//     ES: 'Módulos de Bucle de Fibra',
//     FR: 'Modules de Boucle de Fibre',
//     DE: 'Glasfaser Loopback-Module',
//     PL: 'Moduły Optyczne Loopback',
//     IT: 'Moduli di Loopback in Fibra',
//     DK: 'Fiber Loopback Moduler',
//     SE: 'Fiber Loopback Moduler',
//     NO: 'Fiber Loopback Moduler',
//     FI: 'Kuitukaapelin Loopback Moduulit',
//     GR: 'Μονάδες Βρόχου Οπτικών Ινών',
//     RU: 'Модули оптической петли',
//     CZ: 'Optické Loopback Moduly',
//     SK: 'Optické Loopback Moduly',
//     HU: 'Optikai Loopback Modulok',
//     BG: 'Модули с циклично свързване',
//     RO: 'Module Loopback de Fibra',
//     HR: 'Optički Loopback Moduli',
//     RS: 'Optički Loopback Moduli',
//     MK: 'Оптички модули со петља',
//     AL: 'Module Fibra Loopback',
//     IE: 'Fiber Loopback Modules',
//     LV: 'Optisko Šķiedru Loopback Moduļi',
//     LT: 'Pluoštų Loopback Moduli',
//     EE: 'Kiudkaabli Loopback Moodulid',
//     IS: 'Trefja Loopback Modúlar',
//     NL: 'Glasvezel Loopback Modules',
//     LU: 'Optesch Loopback Moduler',
//     MT: 'Moduli tal-Fibra Loopback',
//     AT: 'Glasfaser Loopback-Module',
// };

// updateCategoryTranslations(categoryId, translations);
