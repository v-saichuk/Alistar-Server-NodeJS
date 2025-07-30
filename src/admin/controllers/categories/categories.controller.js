import { validationResult } from 'express-validator';
import Category from '../../../shared/models/Categories/Categories.js';
import Product from '../../../shared/models/Product.js';
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
