import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import XLSX from 'xlsx';
import path from 'path';
import Product from '../../../models/Product.js';

// Кількість sku в логуванні таблиці 10
const skuCount = 10;
//  parseFiberMall - парсить ціни на сторінці https://www.fibermall.com/buy-[sku].htm та зберігає в файл sku_prices.json
const parseFiberMall = async () => {
    try {
        // Зчитуємо всі SKU з файлу
        const allSkus = JSON.parse(await fs.readFile('./all_skus.json', 'utf-8'));
        const results = [];
        // Підключення до вже запущеного браузера через WebSocket endpoint
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:9222/devtools/browser/b556a8b0-e48a-4fde-a337-4f67292e5d91',
            defaultViewport: null,
            headless: true,
        });

        const progressTable = [];
        for (let i = 0; i < allSkus.length; i++) {
            const sku = allSkus[i];
            let status = 'processing';
            let message = 'Починаю обробку';
            let price = 0;
            progressTable.push({
                '#': i + 1,
                sku,
                status,
                price,
                message,
            });
            console.clear();
            console.table(progressTable.slice(-skuCount));
            const page = await browser.newPage();
            // Блокуємо всі ресурси окрім html
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() === 'document') {
                    req.continue();
                } else {
                    req.abort();
                }
            });
            let found = false;
            try {
                await page.goto(`https://www.fibermall.com/buy-${sku}.htm`, { waitUntil: 'networkidle2', timeout: 60000 });

                // Знайти всі товари на сторінці
                const productLinks = await page.$$eval('ul#con_one_2 li.new_proList_mainListLi .new_proList_ListImg a', (links) =>
                    links.map((a) => a.getAttribute('href')),
                );
                if (productLinks.length === 0) {
                    status = 'not found';
                    message = 'Товари не знайдено на сторінці пошуку';
                }

                for (const link of productLinks) {
                    if (!link) continue;
                    const productPage = await browser.newPage();
                    // Блокуємо всі ресурси окрім html для вкладки товару
                    await productPage.setRequestInterception(true);
                    productPage.on('request', (req) => {
                        if (req.resourceType() === 'document') {
                            req.continue();
                        } else {
                            req.abort();
                        }
                    });
                    try {
                        await productPage.goto(`https://www.fibermall.com${link}`, { waitUntil: 'networkidle2', timeout: 60000 });
                        // Перевірити SKU
                        const pageSku = await productPage.$$eval('span', (spans) => {
                            for (const el of spans) {
                                const match = el.textContent.match(/SKU:(\d+)/);
                                if (match) return match[1];
                            }
                            return null;
                        });
                        if (pageSku && String(pageSku) === String(sku)) {
                            // Взяти ціну
                            const priceVal = await productPage.$eval('#productsbaseprice span[data-price]', (el) =>
                                parseFloat(el.getAttribute('data-price')),
                            );
                            price = isNaN(priceVal) ? 0 : priceVal;
                            found = true;
                            status = 'found';
                            message = `Знайдено!`;
                            await productPage.close();
                            break;
                        }
                    } catch (e) {
                        // ignore
                    }
                    await productPage.close();
                }

                if (!found) {
                    status = 'not found';
                    message = message || 'Не знайдено або ціна відсутня';
                }
                results.push({ sku, price, isFound: found });
            } catch (e) {
                status = 'error';
                message = 'Сталася помилка при обробці';
                results.push({ sku, price: 0, isFound: false });
            }
            await page.close();
            // Оновлюємо відповідний рядок у таблиці
            progressTable[i] = {
                '#': i + 1,
                sku,
                status,
                price,
                message,
            };
            console.clear();
        }

        await browser.disconnect();
        await fs.writeFile('./sku_prices.json', JSON.stringify(results, null, 2));
        console.log('✅ Готово! Дані збережено у sku_prices.json');
        process.exit(0);
    } catch (error) {
        console.error('Сталася помилка:', error);
    }
};

// parseFiberMall().catch(console.error);
// node index.js  запуск тому що якщо через нодемон то автоматично перезавантажуться і починає виконувати код по новому

/**
 * Обробляє файл sku_prices.json:
 * 1. Фільтрує товари з isFound: false і створює Excel файл
 * 2. Оновлює ціни для товарів з isFound: true
 */
const processSkuPricesFile = async () => {
    try {
        // Читаємо файл sku_prices.json
        const skuPricesPath = path.join(process.cwd(), 'sku_prices.json');

        if (!existsSync(skuPricesPath)) {
            throw new Error('Файл sku_prices.json не знайдено');
        }

        const skuPricesData = JSON.parse(readFileSync(skuPricesPath, 'utf8'));

        // Фільтруємо товари з isFound: false
        const notFoundProducts = skuPricesData.filter((item) => !item.isFound);

        let excelFileName = null;

        // Створюємо Excel файл для товарів, які не знайдені
        if (notFoundProducts.length > 0) {
            excelFileName = await createExcelFile(notFoundProducts);
        }

        // Оновлюємо ціни для товарів з isFound: true
        const foundProducts = skuPricesData.filter((item) => item.isFound);
        const updateResult = await updateProductPrices(foundProducts);

        // Виводимо фінальну таблицю з результатами
        console.log('\n' + '='.repeat(60));
        console.log('📊 РОБОТУ ЗАКІНЧЕНО - ФІНАЛЬНА ЗВІТНІСТЬ');
        console.log('='.repeat(60));

        const summaryTable = [
            { Parameter: 'Total', Value: skuPricesData.length },
            { Parameter: 'Updated', Value: updateResult.updatedCount },
            { Parameter: 'Not found', Value: notFoundProducts.length },
            { Parameter: 'Not in DB', Value: updateResult.notFoundInDB },
            { Parameter: 'Excel file', Value: excelFileName || 'Not created' },
        ];

        console.table(summaryTable);
        console.log('='.repeat(60));

        return {
            success: true,
            summary: {
                totalProducts: skuPricesData.length,
                foundProducts: foundProducts.length,
                notFoundProducts: notFoundProducts.length,
                updatedInDB: updateResult.updatedCount,
                notFoundInDB: updateResult.notFoundInDB,
                excelFileCreated: excelFileName,
            },
        };
    } catch (error) {
        console.error('Помилка при обробці файлу sku_prices.json:', error);
        throw error;
    }
};

/**
 * Створює Excel файл з товарами, які не знайдені
 */
const createExcelFile = async (notFoundProducts) => {
    const workbook = XLSX.utils.book_new();

    // Підготовка даних для Excel з пошуком продуктів в базі даних
    const excelData = [];

    for (const item of notFoundProducts) {
        try {
            // Шукаємо продукт за SKU в базі даних
            const product = await Product.findOne({ sku: item.sku });

            const excelRow = {
                SKU: item.sku,
                'Поточна ціна': item.price,
                Статус: 'Не знайдено на FiberMall',
                'Посилання на адмін панель': product ? `https://admin.alistar.ltd/product/${product._id}` : 'Продукт не знайдено в базі даних',
            };

            excelData.push(excelRow);
        } catch (error) {
            console.error(`Помилка при пошуку SKU ${item.sku} в базі даних:`, error);
            excelData.push({
                SKU: item.sku,
                'Поточна ціна': item.price,
                Статус: 'Не знайдено на FiberMall',
                'Посилання на адмін панель': 'Помилка при пошуку в базі даних',
            });
        }
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Товари не знайдені');

    // Зберігаємо Excel файл
    const excelFileName = `not_found_products_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelFilePath = path.join(process.cwd(), excelFileName);
    XLSX.writeFile(workbook, excelFilePath);

    console.log(`Створено Excel файл: ${excelFileName} з ${notFoundProducts.length} товарами`);

    return excelFileName;
};

/**
 * Оновлює ціни продуктів в базі даних
 */
const updateProductPrices = async (foundProducts) => {
    let updatedCount = 0;
    let notFoundInDB = 0;

    for (const item of foundProducts) {
        try {
            // Шукаємо продукт за SKU
            const product = await Product.findOne({ sku: item.sku });

            if (product) {
                // Оновлюємо ціну
                await Product.updateOne({ _id: product._id }, { $set: { price: item.price } });
                updatedCount++;
                console.log(`Оновлено ціну для SKU ${item.sku}: ${item.price}`);
            } else {
                notFoundInDB++;
                console.log(`SKU ${item.sku} не знайдено в базі даних`);
            }
        } catch (error) {
            console.error(`Помилка при оновленні SKU ${item.sku}:`, error);
        }
    }

    return { updatedCount, notFoundInDB };
};

// processSkuPricesFile().catch(console.error);
