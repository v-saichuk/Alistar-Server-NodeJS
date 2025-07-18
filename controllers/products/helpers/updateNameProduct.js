// Функція для додавання "alistar | " до всіх назв продуктів
import Product from '../../../models/Product.js';

async function addAlistarToAllTitles() {
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
        let changed = false;
        const updatedName = { ...product.name };

        for (const lang in updatedName) {
            if (!updatedName[lang]?.startsWith('alistar | ')) {
                updatedName[lang] = `alistar | ${updatedName[lang]}`;
                changed = true;
            }
        }

        if (changed) {
            await Product.updateOne({ _id: product._id }, { $set: { name: updatedName } });
            updatedCount++;
            console.log(`Updated product ${product._id}:`, updatedName);
        }
    }

    console.log(`Done! Updated titles for ${updatedCount} products.`);
    // mongoose.disconnect();
}

// addAlistarToAllTitles().catch(console.error); // Викликаємо функцію для виконання
// ./Функція для додавання "alistar | " до всіх назв продуктів

async function removeAlistarFromAllTitles() {
    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
        let changed = false;
        const updatedName = { ...product.name };

        for (const lang in updatedName) {
            if (updatedName[lang]?.startsWith('alistar | ')) {
                updatedName[lang] = updatedName[lang].replace(/^alistar \| /, '');
                changed = true;
            }
        }

        if (changed) {
            await Product.updateOne({ _id: product._id }, { $set: { name: updatedName } });
            updatedCount++;
            console.log(`Updated product ${product._id}:`, updatedName);
        }
    }

    console.log(`Done! Removed 'alistar |' from ${updatedCount} products.`);
    // mongoose.disconnect();
}
