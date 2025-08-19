import axios from 'axios';
import * as cheerio from 'cheerio';
import Product from '../../../shared/models/Product.js';
import { SendFibermallBulkPriceReport } from '../../../mails/Admin/FibermallBulkPriceReport.message.js';

const FIBERMALL_HOST = 'https://www.fibermall.com';

const httpGet = async (url) => {
    const response = await axios.get(url, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
        },
        validateStatus: (s) => s >= 200 && s < 500,
    });
    return response;
};

const extractProductLinksFromSearch = (html) => {
    const $ = cheerio.load(html);
    const links = [];
    $('ul#con_one_2 li.new_proList_mainListLi .new_proList_ListImg a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
    });
    return links;
};

const extractSkuFromDetail = ($) => {
    let foundSku = null;
    $('span').each((_, el) => {
        const txt = $(el).text();
        const match = txt && txt.match(/SKU:(\d+)/);
        if (match) {
            foundSku = match[1];
            return false;
        }
        return undefined;
    });
    return foundSku;
};

const extractPriceFromDetail = ($) => {
    const priceAttr = $('#productsbaseprice span[data-price]').attr('data-price');
    if (!priceAttr) return null;
    const priceVal = parseFloat(priceAttr);
    return Number.isFinite(priceVal) ? priceVal : null;
};

export const parseFibermallPriceBySku = async (req, res) => {
    try {
        const { sku, update } = req.body || {};
        if (!sku) {
            return res.status(400).json({ success: false, message: "SKU обов'язковий" });
        }

        const searchUrl = `${FIBERMALL_HOST}/buy-${sku}.htm`;
        const searchResp = await httpGet(searchUrl);
        if (searchResp.status >= 400 || !searchResp.data) {
            return res.status(502).json({ success: false, message: 'Помилка отримання сторінки пошуку', code: searchResp.status });
        }

        const links = extractProductLinksFromSearch(searchResp.data);
        if (!links.length) {
            return res.json({ success: true, sku, found: false, price: 0, source: searchUrl });
        }

        let matched = null;
        for (const link of links) {
            const detailUrl = link.startsWith('http') ? link : `${FIBERMALL_HOST}${link}`;
            const detailResp = await httpGet(detailUrl);
            if (detailResp.status >= 400 || !detailResp.data) continue;
            const $ = cheerio.load(detailResp.data);

            const pageSku = extractSkuFromDetail($);
            if (!pageSku || String(pageSku) !== String(sku)) continue;

            const price = extractPriceFromDetail($);
            if (price == null) continue;

            matched = { sku, price, found: true, source: detailUrl };

            if (update) {
                const product = await Product.findOne({ sku: String(sku) });
                if (product) {
                    await Product.updateOne({ _id: product._id }, { $set: { price } });
                    matched.updated = true;
                } else {
                    matched.updated = false;
                    matched.updateMessage = 'Товар зі вказаним SKU не знайдено в БД';
                }
            }

            break;
        }

        if (!matched) {
            return res.json({ success: true, sku, found: false, price: 0, source: searchUrl });
        }

        return res.json({ success: true, ...matched });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера', error: error.message });
    }
};

// const test = async () => {
//     const data = await parseFibermallPriceBySku(
//         {
//             body: {
//                 sku: '10414444444',
//                 update: true,
//             },
//         },
//         {
//             json: (data) => console.log(data),
//         },
//     );
// };

// test();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const bulkParseFibermallPrices = async (req, res) => {
    const startedAt = new Date();
    const summary = {
        startedAt,
        attempted: 0,
        skippedByFlag: 0,
        updated: 0,
        notFoundOnSite: 0,
        errors: 0,
        items: [],
    };
    try {
        const { percent } = req.body || {};
        const percentNum = Number(percent);
        if (!Number.isFinite(percentNum)) {
            return res.status(400).json({ success: false, message: 'percent має бути числом (наприклад, -10 або 5)' });
        }

        const products = await Product.find({ isEditPrice: { $ne: false }, isParserSite: 'fibermall' }).select('sku price');
        if (!products.length) {
            return res.json({ success: true, message: 'Немає товарів для обробки', summary: { ...summary, finishedAt: new Date() } });
        }

        for (const product of products) {
            summary.attempted++;
            const sku = product.sku;
            if (!sku) {
                summary.errors++;
                summary.items.push({ sku: null, status: 'error', message: 'Порожній SKU' });
                continue;
            }

            // retry policy for detail page: up to 3 tries with backoff
            const searchUrl = `${FIBERMALL_HOST}/buy-${sku}.htm`;
            let links = [];
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const resp = await httpGet(searchUrl);
                    if (resp.status < 400 && resp.data) {
                        links = extractProductLinksFromSearch(resp.data);
                        break;
                    }
                } catch (e) {
                    // ignore and retry
                }
                await delay(500 * attempt);
            }

            if (!links.length) {
                summary.notFoundOnSite++;
                summary.items.push({ sku, status: 'not_found', message: 'Пошук без результату', source: searchUrl });
                continue;
            }

            let matchedPrice = null;
            let matchedUrl = null;

            for (const link of links) {
                const detailUrl = link.startsWith('http') ? link : `${FIBERMALL_HOST}${link}`;

                let html = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const resp = await httpGet(detailUrl);
                        if (resp.status < 400 && resp.data) {
                            html = resp.data;
                            break;
                        }
                    } catch (e) {
                        // ignore and retry
                    }
                    await delay(700 * attempt);
                }

                if (!html) continue;

                const $ = cheerio.load(html);
                const pageSku = extractSkuFromDetail($);
                if (!pageSku || String(pageSku) !== String(sku)) continue;

                const price = extractPriceFromDetail($);
                if (price == null) continue;

                matchedPrice = price;
                matchedUrl = detailUrl;
                break;
            }

            if (matchedPrice == null) {
                summary.notFoundOnSite++;
                summary.items.push({ sku, status: 'not_found', message: 'Ціну не знайдено', source: searchUrl });
                continue;
            }

            // apply percent change
            const adjusted = Math.round(matchedPrice * (1 + percentNum / 100) * 100) / 100;

            try {
                await Product.updateOne({ _id: product._id }, { $set: { price: adjusted } });
                summary.updated++;
                summary.items.push({
                    sku,
                    status: 'updated',
                    oldPrice: product.price,
                    parsedPrice: matchedPrice,
                    newPrice: adjusted,
                    source: matchedUrl,
                });
            } catch (e) {
                summary.errors++;
                summary.items.push({ sku, status: 'error', message: e.message });
            }
        }

        const finishedAt = new Date();
        const result = { success: true, summary: { ...summary, finishedAt } };

        // send email with report (Admin mailer)
        try {
            await SendFibermallBulkPriceReport({ ...summary, startedAt, finishedAt, percent: percentNum });
        } catch (e) {}

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера', error: error.message });
    }
};
