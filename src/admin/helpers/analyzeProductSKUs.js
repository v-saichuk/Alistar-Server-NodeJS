import fs from 'fs/promises';
import Product from '../../../src/shared/models/Product.js';

// Аналізуємо всі SKU в параметрах товарів та перевіряємо їх на наявність в базі даних

const analyzeAndSavedProductSKUs = async () => {
    try {
        // Крок 1: Отримуємо всі товари з бази даних
        const products = await Product.find(
            {},
            {
                sku: 1,
                parameters: 1,
            },
        );

        if (!products || products.length === 0) {
            throw new Error('Products not found');
        }

        // Крок 2: Збираємо SKU з параметрів для кожного головного SKU
        const skuAnalysis = products.map((product) => {
            const existingSKU = product.sku;
            const collectedSKUs = [];

            if (product.parameters) {
                product.parameters.forEach((parameter) => {
                    if (parameter.list) {
                        parameter.list.forEach((item) => {
                            if (item.productSKU) {
                                collectedSKUs.push(item.productSKU);
                            }
                        });
                    }
                });
            }

            return {
                heroSKU: existingSKU,
                collectedSKUs,
            };
        });

        // Крок 3: Отримуємо всі існуючі SKU
        const allCollectedSKUs = skuAnalysis.flatMap((item) => item.collectedSKUs);
        const existingProducts = await Product.find({}, { sku: 1 });
        const existingSKUs = new Set(existingProducts.map((product) => product.sku));
        console.log('allCollectedSKUs', allCollectedSKUs.length);
        // Крок 4: Визначаємо, які SKU не існують
        const finalAnalysis = skuAnalysis.map(({ heroSKU, collectedSKUs }) => {
            const nonExistingSKUs = collectedSKUs.filter((sku) => !existingSKUs.has(sku));
            return {
                heroSKU,
                data: nonExistingSKUs,
            };
        });

        // Крок 5: Зберігаємо результат у файл JSON
        const jsonResult = JSON.stringify(
            finalAnalysis.filter((item) => item.data.length > 0),
            null,
            2,
        );
        await fs.writeFile('sku_analysis.json', jsonResult, 'utf-8');

        console.log('Result saved to sku_analysis.json');
        return finalAnalysis;
    } catch (error) {
        console.error('Error:', error.message);
    }
};
// analyzeAndSavedProductSKUs();

// Отримуємо всі SKU з бази даних та зберігаємо їх у файл JSON
const saveAllSKUsToJSON = async () => {
    try {
        // Крок 1: Отримуємо всі товари з бази даних
        const products = await Product.find({}, { sku: 1 }); // Отримуємо лише SKU

        if (!products || products.length === 0) {
            throw new Error('No products found');
        }

        // Крок 2: Збираємо всі SKU в один масив
        const allSKUs = products.map((product) => product.sku);

        // Крок 3: Зберігаємо результат у файл JSON
        const jsonResult = JSON.stringify(allSKUs, null, 2);
        await fs.writeFile('all_skus.json', jsonResult, 'utf-8');

        console.log('All SKUs saved to all_skus.json');
        return allSKUs;
    } catch (error) {
        console.error('Error saving SKUs:', error.message);
    }
};
// saveAllSKUsToJSON();

// Пошук всіх SKU в параметрах та перевірка їх на наявністьтоварів, видає реезультат які товари є на сайті а яких немає
const analyzeProductSKUs = async () => {
    try {
        // Крок 1: Отримуємо всі товари з бази даних
        const products = await Product.find(
            {},
            {
                sku: 1,
                parameters: 1,
            },
        );

        if (!products || products.length === 0) {
            throw new Error('Products not found');
        }

        // Крок 2: Збираємо всі артикули (SKU) з параметрів товарів
        let collectedSKUs = new Set();

        products.forEach((product) => {
            if (product.parameters) {
                product.parameters.forEach((parameter) => {
                    if (parameter.list) {
                        parameter.list.forEach((item) => {
                            if (item.productSKU) {
                                collectedSKUs.add(item.productSKU);
                            }
                        });
                    }
                });
            }
        });

        collectedSKUs = Array.from(collectedSKUs);

        // Крок 3: Видаляємо дублікати та SKU, які існують серед товарів на сайті
        const existingProducts = await Product.find({}, { sku: 1 });
        const existingSKUs = existingProducts.map((product) => product.sku);
        const existingSKUSet = new Set(existingSKUs);

        const nonExistingSKUs = collectedSKUs.filter((sku) => !existingSKUSet.has(sku));

        // Крок 4: Формуємо результат
        const result = {
            загальнаКількістьТоварів: products.length,
            загальнаКількістьЗібранихSKU: collectedSKUs.length,
            загальнаКількістьНеІснуючихSKU: nonExistingSKUs.length,
            неІснуючіSKU: nonExistingSKUs,
        };

        console.log(result);
        return result;
    } catch (error) {
        console.error(error.message);
    }
};
// analyzeProductSKUs();
