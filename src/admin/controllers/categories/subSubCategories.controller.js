import { validationResult } from 'express-validator';
import SubSubCategories from '../../../shared/models/Categories/SubSubCategories.js';
import Product from '../../../shared/models/Product.js';
import transliteration from 'transliteration';

export const getAll = async (req, res) => {
    try {
        const sub_sub_categories = await SubSubCategories.find().populate('parentId');
        const productCounts = await Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', productCount: { $sum: 1 } } }]);

        const productCountMap = Object.fromEntries(productCounts.map(({ _id, productCount }) => [_id, productCount]));

        res.json(
            sub_sub_categories.map((sub_sub_category) => ({
                ...sub_sub_category._doc,
                productCount: productCountMap[sub_sub_category._id] || 0,
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
const createGenerateUniqueSubSubCategorySlug = async (lang, baseSlug, subSubCategoryId = null) => {
    let slug = baseSlug;
    let counter = 1;

    const slugExists = async (slugToCheck) => {
        const subSubCategoryExists = await SubSubCategories.findOne({
            [`slug.${lang}`]: slugToCheck,
            ...(subSubCategoryId ? { _id: { $ne: subSubCategoryId } } : {}),
        });

        return !!subSubCategoryExists;
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
                    const uniqueSlug = await createGenerateUniqueSubSubCategorySlug(lang, baseSlug);
                    slugs[lang] = uniqueSlug;
                } catch (e) {
                    console.error(`Помилка при генерації slug для мови ${lang}:`, e);
                }
            }
        }

        const new_sub_sub_category = new SubSubCategories({
            ...req.body,
            slug: slugs,
        });

        await new_sub_sub_category.save();

        const sub_sub_category = await SubSubCategories.findById(new_sub_sub_category._id).populate('parentId').exec();

        res.json({
            sub_sub_category,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при створені категорії!',
            err,
        });
    }
};
// ===== ./CREATE =====

// ===== UPDATE =====
const updateGenerateUniqueSubSubCategorySlug = async (lang, baseSlug, subSubCategoryId) => {
    let slug = baseSlug;
    let counter = 1;

    while (
        await SubSubCategories.findOne({
            [`slug.${lang}`]: slug,
            _id: { $ne: subSubCategoryId },
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

        const { id: subSubCategoryId, name = {}, ...rest } = req.body;
        const subSubCategory = await SubSubCategories.findById(subSubCategoryId);
        if (!subSubCategory) {
            return res.status(404).json({ success: false, message: 'Sub-subcategory not found!' });
        }

        const currentName = filterObj(subSubCategory.name);
        const currentSlug = filterObj(subSubCategory.slug);
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
                const finalSlug = await updateGenerateUniqueSubSubCategorySlug(lang, baseSlug, subSubCategoryId);
                updatedSlug[lang] = finalSlug;
            }
        }

        await SubSubCategories.updateOne(
            { _id: subSubCategoryId },
            {
                $set: {
                    ...rest,
                    name: updatedName,
                    slug: updatedSlug,
                },
            },
        );

        const updatedSubSubCategory = await SubSubCategories.findById(subSubCategoryId).populate('parentId');

        res.json({
            sub_sub_category: updatedSubSubCategory,
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось оновити суб-субкатегорію!',
            error: err.message,
        });
    }
};
// ===== ./UPDATE =====

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSubSubCategory = await SubSubCategories.findByIdAndDelete(id);

        if (!deletedSubSubCategory) {
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
