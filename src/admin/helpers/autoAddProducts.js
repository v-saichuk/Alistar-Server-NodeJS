import puppeteer from 'puppeteer';
import Product from '../../../src/shared/models/Product.js';
import Category from '../../../src/shared/models/Categories/Categories.js';
import Subcategory from '../../../src/shared/models/Categories/SubCategories.js';
import Subsubcategory from '../../../src/shared/models/Categories/SubSubCategories.js';

const autoAddProducts = async () => {
    try {
        // Підключаємося до вже запущеного браузера через WebSocket
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:9222/devtools/browser/784fc478-d787-4293-bcbe-2c0ea27a1b4a',
            defaultViewport: null,
            headless: true, // Додаємо цей параметр, щоб працювати у "headless" режимі
        });

        // Шукаємо товар за SKU з масиву skuList
        const productList = [];

        for (let productGroup of productList) {
            const { heroSKU, data } = productGroup;

            // Отримуємо головний товар з бази даних
            const heroProduct = await Product.findOne({ sku: heroSKU }, { images: 1, _id: 0 });
            if (!heroProduct || !heroProduct.images) {
                console.error(`Головний товар зі SKU: ${heroSKU} не знайдено або не має зображень.`);
                continue;
            }

            console.log(`Головний товар зі SKU: ${heroSKU} знайдено. Копіюємо зображення.`);
            const heroImages = heroProduct.images;

            for (let sku of data) {
                const page = await browser.newPage();
                try {
                    const existingProduct = await Product.findOne({ sku });
                    if (existingProduct) {
                        console.log(`Товар зі SKU: ${sku} вже існує, пропускаємо його.`);
                        continue;
                    }

                    await page.goto('https://www.fibermall.com/', { waitUntil: 'networkidle2', timeout: 60000 });
                    await page.waitForSelector('input#q.header_main_search_txt');
                    await page.type('input#q.header_main_search_txt', sku);
                    await page.click('input#klabel.header_main_search_btn');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

                    // Знаходимо перший результат товару та переходимо по посиланню
                    let productLink;
                    try {
                        productLink = await page.$eval('.new_proList_mainListLi .new_proList_ListImg a', (element) => element.getAttribute('href'));
                    } catch (error) {
                        console.error('Помилка при знаходженні посилання на товар:', error);
                        await page.close();
                        continue;
                    }

                    if (productLink) {
                        await page.goto(`https://www.fibermall.com${productLink}`, { waitUntil: 'networkidle2', timeout: 60000 });
                        console.log(`Перейшли до товару зі SKU: ${sku}`);
                    } else {
                        console.log(`Товар зі SKU: ${sku} не знайдено`);
                        await page.close();
                        continue;
                    }

                    // Отримуємо заголовок з елемента
                    const title = await page.$eval('.detail_proDecribe_tit h1', (element) => element.textContent.trim());
                    const priceText = await page.$eval('.total_price', (element) => element.textContent.trim());
                    const price = parseInt(priceText.replace(/[^0-9.]/g, '').split('.')[0]); // Залишаємо лише цифри та крапку

                    // Отримуємо FM PN за унікальним текстом "FM PN:"
                    const part_number = await page.evaluate(() => {
                        const elements = document.querySelectorAll('.left_box');
                        for (let element of elements) {
                            if (element.textContent.trim() === 'FM PN:') {
                                return element.nextElementSibling.querySelector('.pro_item_special1 span').textContent.trim();
                            }
                        }
                        return null;
                    });

                    console.log(`Знайдений заголовок: ${title}`);
                    console.log(`Знайдена ціна: ${price}`);
                    console.log(`Знайдений FM PN: ${part_number}`);

                    // Отримуємо категорію, підкатегорію, під підкатегорію
                    const categories = await page.evaluate(() => {
                        const categoryElements = document.querySelectorAll('.menu_list_cont.dlb .ddb.Home_next');
                        const categories = [];
                        categoryElements.forEach((element) => {
                            const category = element.querySelector('a span')?.textContent.trim();
                            if (category) {
                                categories.push(category);
                            }
                        });
                        return categories;
                    });

                    const [category, subCategory, subSubCategory] = categories;
                    console.log(`Категорія: ${category}`);
                    console.log(`Підкатегорія: ${subCategory}`);
                    console.log(`Під підкатегорія: ${subSubCategory}`);

                    // Функція для нормалізації тексту
                    const normalizeText = (text) => {
                        return text
                            .replace(/\s+/g, ' ') // Заміна множинних пробілів одним пробілом
                            .trim() // Обрізання зайвих пробілів
                            .toLowerCase(); // Перетворення на нижній регістр
                    };

                    // Функція для обчислення схожості тексту
                    const similarity = (text1, text2) => {
                        const normalized1 = normalizeText(text1);
                        const normalized2 = normalizeText(text2);
                        const len1 = normalized1.length;
                        const len2 = normalized2.length;
                        let match = 0;

                        for (let i = 0; i < Math.min(len1, len2); i++) {
                            if (normalized1[i] === normalized2[i]) {
                                match++;
                            }
                        }

                        return match / Math.max(len1, len2);
                    };

                    // Отримуємо ID категорій з бази даних з урахуванням схожості
                    const categoryIds = [];
                    if (category) {
                        const allCategories = await Category.find({});
                        const bestMatch = allCategories.reduce(
                            (best, current) => {
                                const currentSimilarity = similarity(category, current.name.US);
                                return currentSimilarity > best.similarity ? { category: current, similarity: currentSimilarity } : best;
                            },
                            { category: null, similarity: 0 },
                        );

                        if (bestMatch.similarity > 0.5) {
                            // Поріг схожості
                            categoryIds.push(bestMatch.category._id.toString());
                        }
                    }
                    if (subCategory) {
                        const allSubCategories = await Subcategory.find({ parentId: categoryIds[0] });
                        const bestMatch = allSubCategories.reduce(
                            (best, current) => {
                                const currentSimilarity = similarity(subCategory, current.name.US);
                                return currentSimilarity > best.similarity ? { category: current, similarity: currentSimilarity } : best;
                            },
                            { category: null, similarity: 0 },
                        );

                        if (bestMatch.similarity > 0.5) {
                            categoryIds.push(bestMatch.category._id.toString());
                        }
                    }
                    if (subSubCategory) {
                        const allSubSubCategories = await Subsubcategory.find({ parentId: categoryIds[1] });
                        const bestMatch = allSubSubCategories.reduce(
                            (best, current) => {
                                const currentSimilarity = similarity(subSubCategory, current.name.US);
                                return currentSimilarity > best.similarity ? { category: current, similarity: currentSimilarity } : best;
                            },
                            { category: null, similarity: 0 },
                        );

                        if (bestMatch.similarity > 0.5) {
                            categoryIds.push(bestMatch.category._id.toString());
                        }
                    }

                    console.log(`ID категорій: ${JSON.stringify(categoryIds)}`);

                    // Отримуємо опис товару, заголовок та таблицю
                    const description = await page.evaluate(() => {
                        const detailElement = document.querySelector('.detail_text_dom');
                        const descriptionElement = document.querySelector('.m_product_description');

                        if (!detailElement || !descriptionElement) return null;

                        // Отримуємо заголовок
                        const titleElement = detailElement.querySelector('h2');
                        let title = '';
                        if (titleElement) {
                            title = titleElement.textContent.trim();
                        }
                        const formattedTitle = `<div><span style="font-size: 16px;"><strong>${title}</strong></span></div><br>`;

                        // Отримуємо опис
                        const descriptionTextElement = detailElement.querySelector('h4');
                        let descriptionText = '';
                        if (descriptionTextElement) {
                            descriptionText = descriptionTextElement.textContent.trim();
                        }
                        const formattedDescription = `<p>${descriptionText}</p><br>`;

                        // Отримуємо таблицю
                        let descriptionHTML = '<div>';
                        let currentNode = descriptionElement.firstChild;

                        while (currentNode) {
                            if (currentNode.tagName === 'TABLE') {
                                descriptionHTML += '<table border="0" cellpadding="0" cellspacing="0" width="100%" class="solu_table01"><tbody>';
                                const rows = currentNode.querySelectorAll('tr');
                                rows.forEach((row) => {
                                    descriptionHTML += '<tr>';
                                    const cells = row.querySelectorAll('td');
                                    cells.forEach((cell) => {
                                        const cellContent = cell.innerHTML.trim();
                                        descriptionHTML += `<td>${cellContent}</td>`;
                                    });
                                    descriptionHTML += '</tr>';
                                });
                                descriptionHTML += '</tbody></table>';
                            } else {
                                descriptionHTML += currentNode.outerHTML || currentNode.textContent;
                            }
                            currentNode = currentNode.nextSibling;
                        }

                        descriptionHTML += '</div>';

                        return `${formattedTitle}${formattedDescription}${descriptionHTML}`.trim();
                    });

                    console.log(`Опис додано!`);

                    // Збираємо параметри зі сторінки
                    const parameters = await page.evaluate(() => {
                        const parameterBlocks = document.querySelectorAll('.detail_proAssess_starNum .detail_transceiver_type');
                        const parameters = [];

                        parameterBlocks.forEach((block) => {
                            const paramName = block.querySelector('dt')?.textContent.trim();
                            if (!paramName) return;

                            const paramList = [];
                            const options = block.querySelectorAll('dd');

                            options.forEach((option) => {
                                const title = option.querySelector('a')?.textContent.trim();
                                if (!title) return;

                                const isActive = option.classList.contains('current');

                                if (isActive) {
                                    paramList.push({ title: title, active: true });
                                } else {
                                    const link = option.querySelector('a').getAttribute('href');
                                    if (link) {
                                        paramList.push({ title: title, link: link });
                                    }
                                }
                            });

                            parameters.push({
                                name: { UA: paramName },
                                visible: { product: true, filter: false },
                                list: paramList,
                            });
                        });

                        return parameters;
                    });

                    // Оновлюємо список параметрів з отриманням SKU для кожного варіанту
                    for (let param of parameters) {
                        for (let item of param.list) {
                            if (item.link) {
                                const newPage = await browser.newPage();
                                try {
                                    await newPage.goto(`https://www.fibermall.com${item.link}`, { waitUntil: 'networkidle2', timeout: 60000 });
                                    const pageContent = await newPage.content();
                                    const skuMatch = pageContent.match(/SKU:\s*(\d+)/);
                                    const productSKU = skuMatch ? skuMatch[1] : null;
                                    item.productSKU = productSKU;
                                } catch (error) {
                                    console.error('Помилка при отриманні SKU:', error);
                                } finally {
                                    await newPage.close();
                                }
                                delete item.link; // Видаляємо посилання, оскільки воно більше не потрібне
                            }
                        }
                    }

                    console.log(`Знайдені параметри: ${JSON.stringify(parameters, null, 2)}`);

                    // Створюємо об'єкт товару
                    const product = {
                        name: { UA: title },
                        description: { UA: description },
                        active: true,
                        sku,
                        availability: '66bbad6b6b7c05dc6e88c25b',
                        part_number,
                        category: categoryIds,
                        price,
                        parameters,
                        images: heroImages,
                    };

                    // Зберігаємо товар у базу даних
                    const productSave = new Product(product);
                    const savedProduct = await productSave.save();

                    console.log(`Об'єкт товару: ${JSON.stringify(product, null, 2)}`);
                    console.log('Товар збережено!');
                } catch (error) {
                    console.error('Сталася помилка на етапі виконання скрипту:', error);
                } finally {
                    await page.close();
                }
            }
        }
    } catch (error) {
        console.error('Сталася помилка при підключенні до браузера:', error);
    }
};

// Викликаємо функцію autoAddProducts
// autoAddProducts().catch((error) => {
//     console.error('Сталася помилка в основній функції:', error);
// });

// Переклад заголовка по SKU
const translateNameSku = async () => {
    try {
        // Підключення до вже запущеного браузера через WebSocket
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:9222/devtools/browser/272ce80d-f9b3-4457-b0b2-45a1641c516d',
            defaultViewport: null,
            headless: true,
        });

        // Список SKU для обробки
        const skuList = ['30006'];
        let updatedCount = 0;
        const notUpdatedSkus = [];

        for (let sku of skuList) {
            // Знаходимо товар за SKU
            const product = await Product.findOne({ sku });
            if (!product) {
                console.log(`Товар із SKU ${sku} не знайдено`);
                notUpdatedSkus.push(sku);
                continue;
            }

            // Відкриваємо нову сторінку
            const page = await browser.newPage();

            // Переходимо на конкретну сторінку чату
            await page.goto('https://chatgpt.com/?temporary-chat=true&model=o1-preview');
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Затримка для завантаження сторінки

            // Знаходимо поле введення повідомлення
            const textArea = await page.waitForSelector('div.ProseMirror[id="prompt-textarea"]', { visible: true });
            await page.evaluate((textarea) => textarea.scrollIntoView(), textArea); // Скролимо до текстового поля
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням на текстове поле

            // Вводимо новий текст з використанням назви товару
            await textArea.click();
            await page.keyboard.type(
                `Це назви модулів або кабелів потрібно знайти або вірно перекласти назву на вказані мови AL, AT, BG, CZ, DE, DK, EE, ES, FI, FR, GR, HR, HU, IE, IS, IT, LT, LU, LV, MK, MT, NL, NO, PL, PT, RO, RS, RU, SE, SK, UA, US: (${product.name.UA})  Переклад повинен бути логічний і зрозумілий для читання. Видай переклад в форматі коду об'єкта в вигляді {"AL": "", "AT": "", ....}  ОБОВЯЗКОВО Без зайвого тексту, Лише об'єкт в JSON.`,
            );

            // Натискаємо кнопку "Надіслати"
            const sendButton = await page.waitForSelector('button[data-testid="send-button"]', { visible: true });
            await page.evaluate((button) => button.scrollIntoView(), sendButton); // Скролимо до кнопки, щоб вона стала клікабельною
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням кнопки надсилання
            await sendButton.click();

            console.log('Повідомлення надіслано');

            // Постійно скролимо сторінку донизу, щоб бачити нові повідомлення
            const scrollInterval = setInterval(async () => {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            }, 1000);

            // Очікуємо на відповідь (перевіряємо періодично наявність кнопок, щоб визначити готовність відповіді)
            let responseReady = false;
            while (!responseReady) {
                responseReady = (await page.$('button[data-testid="voice-play-turn-action-button"]')) !== null;

                // Перевіряємо, чи з'явилася кнопка "Продовжити створення"
                const continueButton = await page.$('button.btn-secondary.btn-small');
                if (continueButton) {
                    await continueButton.click();
                    console.log('Натискаємо "Продовжити створення" для завершення відповіді');
                }

                if (!responseReady) {
                    await new Promise((resolve) => setTimeout(resolve, 1000)); // Чекаємо одну секунду перед повторною перевіркою
                }
            }

            // Зупиняємо скролінг, коли отримано відповідь
            clearInterval(scrollInterval);

            // Перевіряємо наявність відповіді у вигляді коду
            const responseCodeElement = await page.$('div.markdown.prose pre code.hljs.language-json');
            if (responseCodeElement) {
                const responseCode = await page.evaluate((el) => el.textContent, responseCodeElement);
                // console.log('Отримана відповідь:', responseCode);

                // Перетворюємо відповідь в об'єкт
                const translations = JSON.parse(responseCode);

                // Список необхідних властивостей
                const requiredProperties = [
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

                // Перевірка, чи всі необхідні властивості отримано
                const allPropertiesReceived = requiredProperties.every((prop) => prop in translations);

                if (allPropertiesReceived) {
                    // Оновлюємо поля товару
                    const result = await Product.updateOne(
                        { sku },
                        {
                            $set: {
                                name: translations,
                                // description: descriptionTranslations,
                            },
                        },
                    );

                    if (result.modifiedCount === 0) {
                        console.log(`No changes were made for SKU ${sku}. Product not found or already updated.`);
                        notUpdatedSkus.push(sku);
                    } else {
                        console.log(`Product with SKU ${sku} successfully updated.`);
                        updatedCount++;
                    }
                } else {
                    console.log(
                        'Не всі необхідні властивості були отримані для SKU',
                        sku,
                        ':',
                        requiredProperties.filter((prop) => !(prop in translations)),
                    );
                    notUpdatedSkus.push(sku);
                }
            } else {
                console.log('Не вдалося знайти елемент з відповіддю у вигляді JSON-коду для SKU', sku);
                notUpdatedSkus.push(sku);
            }

            // Закриваємо сторінку
            await page.close();
        }

        console.log(`Загальна кількість оновлених товарів: ${updatedCount}`);
        console.log(`Товари, які не були відредаговані:`, notUpdatedSkus);
    } catch (error) {
        console.error('Помилка:', error);
    }
};
// translateNameSku();
// ./Переклад заголовка по SKU

// Шукаємо всі товари в яких не додані заголовки та додаємо
const translateALLName = async () => {
    let updatedCount = 0;
    const notUpdatedSkus = [];
    try {
        // Підключення до вже запущеного браузера через WebSocket
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:9222/devtools/browser/fb41705f-7052-424d-8418-f6748b1787d3',
            defaultViewport: null,
            headless: true,
        });

        // Отримуємо всі товари, в яких не доданий заголовок на всіх мовах
        const products = await Product.find({
            $or: [
                { 'name.AL': { $exists: false } },
                { 'name.AT': { $exists: false } },
                { 'name.BG': { $exists: false } },
                { 'name.CZ': { $exists: false } },
                { 'name.DE': { $exists: false } },
                { 'name.DK': { $exists: false } },
                { 'name.EE': { $exists: false } },
                { 'name.ES': { $exists: false } },
                { 'name.FI': { $exists: false } },
                { 'name.FR': { $exists: false } },
                { 'name.GR': { $exists: false } },
                { 'name.HR': { $exists: false } },
                { 'name.HU': { $exists: false } },
                { 'name.IE': { $exists: false } },
                { 'name.IS': { $exists: false } },
                { 'name.IT': { $exists: false } },
                { 'name.LT': { $exists: false } },
                { 'name.LU': { $exists: false } },
                { 'name.LV': { $exists: false } },
                { 'name.MK': { $exists: false } },
                { 'name.MT': { $exists: false } },
                { 'name.NL': { $exists: false } },
                { 'name.NO': { $exists: false } },
                { 'name.PL': { $exists: false } },
                { 'name.PT': { $exists: false } },
                { 'name.RO': { $exists: false } },
                { 'name.RS': { $exists: false } },
                { 'name.RU': { $exists: false } },
                { 'name.SE': { $exists: false } },
                { 'name.SK': { $exists: false } },
                { 'name.UA': { $exists: false } },
                { 'name.US': { $exists: false } },
            ],
        }).lean();

        // Фільтруємо товари, в яких більшість заголовків відсутні або порожні
        const filteredProducts = products.filter((product) => {
            const requiredProperties = [
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
            let emptyCount = 0;
            requiredProperties.forEach((prop) => {
                if (!product.name || !product.name[prop] || product.name[prop].trim() === '') {
                    emptyCount++;
                }
            });
            return emptyCount > requiredProperties.length / 2;
        });

        for (let product of filteredProducts) {
            const sku = product.sku;

            // Відкриваємо нову сторінку
            const page = await browser.newPage();

            // Переходимо на конкретну сторінку чату
            await page.goto('https://chatgpt.com/?temporary-chat=true&model=gpt-4o');
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Затримка для завантаження сторінки

            // Знаходимо поле введення повідомлення
            const textArea = await page.waitForSelector('div.ProseMirror[id="prompt-textarea"]', { visible: true });
            await page.evaluate((textarea) => textarea.scrollIntoView(), textArea); // Скролимо до текстового поля
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням на текстове поле

            // Вводимо новий текст з використанням назви товару
            await textArea.click();
            await page.keyboard.type(
                `Це назви модулів або кабелів потрібно знайти або вірно перекласти назву на вказані мови AL, AT, BG, CZ, DE, DK, EE, ES, FI, FR, GR, HR, HU, IE, IS, IT, LT, LU, LV, MK, MT, NL, NO, PL, PT, RO, RS, RU, SE, SK, UA, US: (${
                    product.name?.UA || 'назва відсутня'
                })  Переклад повинен бути логічний і зрозумілий для читання. Видай переклад в форматі коду об'єкта в вигляді {"AL": "", "AT": "", ....}  ОБОВЯЗКОВО Без зайвого тексту, Лише об'єкт в JSON.`,
            );

            // Натискаємо кнопку "Надіслати"
            const sendButton = await page.waitForSelector('button[data-testid="send-button"]', { visible: true });
            await page.evaluate((button) => button.scrollIntoView(), sendButton); // Скролимо до кнопки, щоб вона стала клікабельною
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням кнопки надсилання
            await sendButton.click();

            console.log('Повідомлення надіслано');

            // Постійно скролимо сторінку донизу, щоб бачити нові повідомлення
            const scrollInterval = setInterval(async () => {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            }, 1000);

            // Очікуємо на відповідь (перевіряємо періодично наявність кнопок, щоб визначити готовність відповіді)
            let responseReady = false;
            while (!responseReady) {
                responseReady = (await page.$('button[data-testid="voice-play-turn-action-button"]')) !== null;

                // Перевіряємо, чи з'явилася кнопка "Продовжити створення"
                const continueButton = await page.$('button.btn-secondary.btn-small');
                if (continueButton) {
                    await continueButton.click();
                    console.log('Натискаємо "Продовжити створення" для завершення відповіді');
                    responseReady = false; // Потрібно знову чекати готовність відповіді
                }

                if (!responseReady) {
                    await new Promise((resolve) => setTimeout(resolve, 1000)); // Чекаємо одну секунду перед повторною перевіркою
                }
            }

            // Зупиняємо скролінг, коли отримано відповідь
            clearInterval(scrollInterval);

            // Перевіряємо наявність відповіді у вигляді коду
            const responseCodeElement = await page.$('div.markdown.prose pre code.hljs.language-json');
            if (responseCodeElement) {
                const responseCode = await page.evaluate((el) => el.textContent, responseCodeElement);

                // Перетворюємо відповідь в об'єкт
                const translations = JSON.parse(responseCode);

                // Список необхідних властивостей
                const requiredProperties = [
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

                // Перевірка, чи всі необхідні властивості отримано
                const allPropertiesReceived = requiredProperties.every((prop) => prop in translations);

                if (allPropertiesReceived) {
                    // Оновлюємо поля товару
                    const result = await Product.updateOne(
                        { sku },
                        {
                            $set: {
                                name: translations,
                                // description: descriptionTranslations,
                            },
                        },
                    );

                    if (result.modifiedCount === 0) {
                        console.log(`No changes were made for SKU ${sku}. Product not found or already updated.`);
                        notUpdatedSkus.push(sku);
                    } else {
                        console.log(`Product with SKU ${sku} successfully updated.`);
                        updatedCount++;
                    }
                } else {
                    console.log(
                        'Не всі необхідні властивості були отримані для SKU',
                        sku,
                        ':',
                        requiredProperties.filter((prop) => !(prop in translations)),
                    );
                    notUpdatedSkus.push(sku);
                }
            } else {
                console.log('Не вдалося знайти елемент з відповіддю у вигляді JSON-коду для SKU', sku);
                notUpdatedSkus.push(sku);
            }

            // Закриваємо сторінку
            await page.close();
        }
    } catch (error) {
        console.error('Помилка:', error);
    } finally {
        console.log(`Загальна кількість оновлених товарів: ${updatedCount}`);
        console.log(`Товари, які не були відредаговані:`, notUpdatedSkus);
    }
};
// translateALLName();

// ===== ОПИС =====
const translateDescriptionSku = async () => {
    let updatedCount = 0;
    const notUpdatedSkus = [];
    const updatedProducts = [];
    try {
        // Підключення до вже запущеного браузера через WebSocket
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:9222/devtools/browser/c2fca9b1-0341-487b-994c-047e628a8e29',
            defaultViewport: null,
            headless: true,
        });

        const skuList = ['18173'];
        // Список мов для перекладу
        const languages = [
            {
                title: 'Українська',
                code: 'UA',
            },
            {
                title: 'English',
                code: 'US',
            },
            {
                title: 'Português',
                code: 'PT',
            },
            {
                title: 'Español',
                code: 'ES',
            },
            {
                title: 'Français',
                code: 'FR',
            },
            {
                title: 'Deutsch',
                code: 'DE',
            },
            {
                title: 'Polski',
                code: 'PL',
            },
            {
                title: 'Italiano',
                code: 'IT',
            },
            {
                title: 'Dansk',
                code: 'DK',
            },
            {
                title: 'Svenska',
                code: 'SE',
            },
            {
                title: 'Norsk',
                code: 'NO',
            },
            {
                title: 'Suomi',
                code: 'FI',
            },
            {
                title: 'Ελληνικά',
                code: 'GR',
            },
            {
                title: 'Русский',
                code: 'RU',
            },
            {
                title: 'Čeština',
                code: 'CZ',
            },
            {
                title: 'Slovenčina',
                code: 'SK',
            },
            {
                title: 'Magyar',
                code: 'HU',
            },
            {
                title: 'Български',
                code: 'BG',
            },
            {
                title: 'Română',
                code: 'RO',
            },
            {
                title: 'Hrvatski',
                code: 'HR',
            },
            {
                title: 'Српски',
                code: 'RS',
            },
            {
                title: 'Македонски',
                code: 'MK',
            },
            {
                title: 'Shqip',
                code: 'AL',
            },
            {
                title: 'Gaeilge',
                code: 'IE',
            },
            {
                title: 'Latviešu',
                code: 'LV',
            },
            {
                title: 'Lietuvių',
                code: 'LT',
            },
            {
                title: 'Eesti',
                code: 'EE',
            },
            {
                title: 'Íslenska',
                code: 'IS',
            },
            {
                title: 'Nederlands',
                code: 'NL',
            },
            {
                title: 'Lëtzebuergesch',
                code: 'LU',
            },
            {
                title: 'Malti',
                code: 'MT',
            },
            {
                title: 'Austrian',
                code: 'AT',
            },
        ];

        // Обробляємо кожен SKU
        for (let sku of skuList) {
            // Знаходимо товар за SKU
            const product = await Product.findOne({ sku });
            if (!product) {
                console.log(`Товар із SKU ${sku} не знайдено`);
                notUpdatedSkus.push(sku);
                continue;
            }

            let updatedLanguagesCount = 0;

            for (let lang of languages) {
                let translationSuccess = false;
                while (!translationSuccess) {
                    try {
                        // Відкриваємо нову сторінку
                        const page = await browser.newPage();

                        // Переходимо на конкретну сторінку чату
                        await page.goto('https://chatgpt.com/?temporary-chat=true&model=gpt-4o-mini');
                        await new Promise((resolve) => setTimeout(resolve, 2000)); // Затримка для завантаження сторінки

                        // Знаходимо поле введення повідомлення
                        const textArea = await page.waitForSelector('div.ProseMirror[id="prompt-textarea"]', { visible: true });
                        await page.evaluate((textarea) => textarea.scrollIntoView(), textArea); // Скролимо до текстового поля
                        await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням на текстове поле

                        // Вводимо новий текст з використанням опису товару
                        await textArea.click();
                        const formattedDescription = product.description.UA.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                        await page.keyboard.type(
                            `Переклади на ${lang.title} мову, та прибери всі зайві теги, онови таблицю, результат видай в форматі коду: (${formattedDescription})`,
                        );

                        // Натискаємо кнопку "Надіслати"
                        const sendButton = await page.waitForSelector('button[data-testid="send-button"]', { visible: true });
                        await page.evaluate((button) => button.scrollIntoView(), sendButton); // Скролимо до кнопки, щоб вона стала клікабельною
                        await new Promise((resolve) => setTimeout(resolve, 1000)); // Затримка перед натисканням кнопки надсилання
                        await sendButton.click();

                        console.log('Повідомлення надіслано');

                        // Перевірка на наявність помилки через 2 секунди після надсилання повідомлення
                        await new Promise((resolve) => setTimeout(resolve, 2000)); // Затримка перед перевіркою на помилку
                        let errorFound = await page.evaluate(() => {
                            return document.querySelector('div.text-token-text-error') !== null;
                        });

                        if (errorFound) {
                            console.log('Виявлено помилку. Закриваємо сторінку та чекаємо 1 хвилин перед повторною спробою...');
                            await page.close();
                            await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000)); // Затримка 1 хвилин
                            continue;
                        }

                        // Очікуємо на відповідь
                        let responseReady = false;
                        while (!responseReady) {
                            responseReady = (await page.$('button[data-testid="voice-play-turn-action-button"]')) !== null;

                            // Перевіряємо, чи з'явилася кнопка "Продовжити створення"
                            const continueButton = await page.$('button.btn-secondary.btn-small');
                            if (continueButton) {
                                await continueButton.click();
                                console.log('Натискаємо "Продовжити створення" для завершення відповіді');
                                responseReady = false; // Потрібно знову чекати готовність відповіді
                            }

                            if (!responseReady) {
                                await new Promise((resolve) => setTimeout(resolve, 1000)); // Чекаємо одну секунду перед повторною перевіркою
                            }
                        }

                        // Перевіряємо наявність відповіді
                        const responseElement = await page.$('div.markdown.prose pre code');
                        if (responseElement) {
                            const responseText = await page.evaluate((el) => el.textContent, responseElement);

                            // Оновлюємо поле опису товару для зазначеної мови
                            const updateResult = await Product.updateOne(
                                { sku },
                                {
                                    $set: {
                                        [`description.${lang.code}`]: responseText,
                                    },
                                },
                            );

                            if (updateResult.modifiedCount === 0) {
                                console.log(`No changes were made for SKU ${sku}. Product not found or already updated.`);
                                notUpdatedSkus.push(sku);
                            } else {
                                console.log(`Product with SKU ${sku} successfully updated for language ${lang.code}.`);
                                updatedCount++;
                                updatedLanguagesCount++;
                                translationSuccess = true;
                            }
                        } else {
                            console.log('Не вдалося знайти відповідь для SKU', sku);
                        }

                        // Закриваємо сторінку
                        await page.close();
                    } catch (error) {
                        console.error(`Помилка під час перекладу для SKU ${sku} на мову ${lang.title}:`, error);
                        // Спробуємо ще раз, не пропускаємо мову
                    }
                }
            }

            if (updatedLanguagesCount > 0) {
                updatedProducts.push({ sku, updatedLanguagesCount });
            } else {
                notUpdatedSkus.push(sku);
            }
        }

        updatedProducts.forEach((product) => {
            console.log(`Product SKU: ${product.sku}, кількість оновлених мов: ${product.updatedLanguagesCount}`);
        });

        console.log(`Загальна кількість оновлених товарів: ${updatedProducts.length}`);
        console.log(`Товари, які не були відредаговані:`, notUpdatedSkus.join(', '));
    } catch (error) {
        console.error('Помилка:', error);
    }
};
