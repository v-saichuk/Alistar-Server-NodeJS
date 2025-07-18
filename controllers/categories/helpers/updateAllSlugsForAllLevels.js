/**
 * Оновлює всі slug-и для всіх рівнів категорій (категорії, підкатегорії, підпідкатегорії).
 *
 * Ця функція проходить через всі документи в кожній колекції (категорії, підкатегорії, підпідкатегорії),
 * генерує унікальні slug-и для кожної мови на основі імені, та оновлює документи, якщо slug змінився.
 */

import Category from '../../../models/Categories/Categories.js';
import SubCategories from '../../../models/Categories/SubCategories.js';
import SubSubCategories from '../../../models/Categories/SubSubCategories.js';
import transliteration from 'transliteration';

const generateUniqueSlug = async (model, lang, baseSlug, id) => {
    let slug = baseSlug;
    let counter = 1;

    while (
        await model.findOne({
            [`slug.${lang}`]: slug,
            _id: { $ne: id },
        })
    ) {
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
};

const filterLangFields = (obj = {}) => Object.fromEntries(Object.entries(obj).filter(([k]) => typeof k === 'string'));

export const updateAllSlugsForAllLevels = async (req, res) => {
    try {
        const collections = [
            { name: 'category', model: Category },
            { name: 'sub_category', model: SubCategories },
            { name: 'sub_sub_category', model: SubSubCategories },
        ];

        const summary = [];

        for (const { name, model } of collections) {
            const docs = await model.find({});
            const updatedItems = [];

            for (const doc of docs) {
                const currentName = filterLangFields(doc.name || {});
                const currentSlug = doc.slug || {};
                const newSlugs = { ...currentSlug };
                let updated = false;

                for (const [lang, nameValue] of Object.entries(currentName)) {
                    if (!nameValue) continue;

                    const oldSlug = currentSlug[lang];
                    const baseSlug = transliteration.slugify(nameValue.toLowerCase());
                    const uniqueSlug = await generateUniqueSlug(model, lang, baseSlug, doc._id);

                    if (!oldSlug || oldSlug !== uniqueSlug) {
                        newSlugs[lang] = uniqueSlug;
                        updated = true;
                    }
                }

                if (updated) {
                    await model.updateOne({ _id: doc._id }, { $set: { slug: newSlugs } });
                    updatedItems.push({ id: doc._id, slug: newSlugs });
                }
            }

            summary.push({
                level: name,
                updatedCount: updatedItems.length,
                updatedItems,
            });
        }

        res.json({
            success: true,
            summary,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Помилка при масовому оновленні slug',
            error: err.message,
        });
    }
};
