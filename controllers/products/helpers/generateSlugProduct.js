// Функція для оновлення slug продуктів на основі їх назв
// Використовується для виправлення відсутніх slug у різних мовах

import Product from '../../models/Product.js';
import { slugify } from 'transliteration';

async function fixAllProductSlugs() {
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
        const updatedSlug = { ...product.slug };
        let changed = false;

        for (const lang in product.name) {
            if (!product.slug?.[lang] && product.name[lang]) {
                updatedSlug[lang] = slugify(product.name[lang].toLowerCase());
                changed = true;
            }
        }

        if (changed) {
            await Product.updateOne({ _id: product._id }, { $set: { slug: updatedSlug } });
            updatedCount++;
            console.log(`Updated product ${product._id}:`, updatedSlug);
        }
    }

    console.log(`Done! Updated slugs for ${updatedCount} products.`);
    // mongoose.disconnect(); // якщо підключались тут
}

// Виклик скрипта напряму з node
// fixAllProductSlugs().catch(console.error);
