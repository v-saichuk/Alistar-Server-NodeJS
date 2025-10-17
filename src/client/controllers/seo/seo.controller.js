import axios from 'axios';
import Redis from 'ioredis';
import Product from '../../../shared/models/Product.js';
import Language from '../../../shared/models/Language.js';
import Category from '../../../shared/models/Categories/Categories.js';
import SubCategory from '../../../shared/models/Categories/SubCategories.js';
import SubSubCategory from '../../../shared/models/Categories/SubSubCategories.js';
import { normalizeImageUrl } from '../../../shared/utils/normalizeImageUrl.js';

// Створюємо Redis клієнт з обробкою помилок
let redis = null;
try {
    redis = new Redis({
        host: 'localhost',
        port: 6379,
        password: '2107fily',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Не підключаємося одразу
        connectTimeout: 5000, // 5 секунд на підключення
    });

    redis.on('error', (err) => {
        console.error('Redis connection error:', err.message);
        redis = null; // Відключаємо при помилці
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    redis.on('close', () => {
        console.log('❌ Redis connection closed');
        redis = null;
    });
} catch (error) {
    console.error('Failed to create Redis client:', error.message);
    redis = null;
}
const SITE_URL = 'https://alistar.ltd';

// export const generateSitemapIndex = async (req, res) => {
//     try {
//         const languages = await Language.find({});
//         const sitemapUrls = languages.map((lang) => {
//             return `<sitemap>
//                         <loc>${SITE_URL}/sitemap-${lang.urlCode}.xml</loc>
//                         <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
//                     </sitemap>`;
//         });

//         const xml = `<?xml version="1.0" encoding="UTF-8"?>
//                         <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//                         ${sitemapUrls.join('\n')}
//                     </sitemapindex>`;
//         res.setHeader('Content-Type', 'application/xml');
//         res.send(xml);
//     } catch (err) {
//         console.error('Error generating sitemap index:', err);
//         res.status(500).send('Internal Server Error');
//     }
// };

// export const generateMainSitemapIndex = async (req, res) => {
//     try {
//         const languages = await Language.find({});
//         let sitemapEntries = [];
//         for (const lang of languages) {
//             const totalProducts = await Product.countDocuments();
//             const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
//             for (let i = 1; i <= totalPages; i++) {
//                 sitemapEntries.push(
//                     `<sitemap><loc>${SITE_URL}/sitemap-${lang.urlCode}/${i}.xml</loc><lastmod>${
//                         new Date().toISOString().split('T')[0]
//                     }</lastmod></sitemap>`,
//                 );
//             }
//         }
//         const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join(
//             '',
//         )}</sitemapindex>`;
//         res.setHeader('Content-Type', 'application/xml; charset=utf-8');
//         res.setHeader('Cache-Control', 'public, max-age=86400');
//         res.send(xml);
//     } catch (err) {
//         console.error('Error generating main sitemap index:', err);
//         res.status(500).send('Internal Server Error');
//     }
// };

export const generateMainSitemapIndex = async (req, res) => {
    try {
        const languages = await Language.find({});
        const sitemapEntries = languages
            .map(
                (lang) =>
                    `<sitemap><loc>${SITE_URL}/${lang.urlCode}/sitemap.xml</loc><lastmod>${
                        new Date().toISOString().split('T')[0]
                    }</lastmod></sitemap>`,
            )
            .join('');
        const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries}</sitemapindex>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        // res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(xml);
    } catch (err) {
        console.error('Error generating main sitemap index:', err);
        res.status(500).send('Internal Server Error');
    }
};

// export const generateSitemapForLangPart = async (req, res) => {
//     try {
//         const { lang } = req.params;
//         const currentLanguage = await Language.findOne({ urlCode: lang });
//         if (!currentLanguage) {
//             res.setHeader('Content-Type', 'text/plain; charset=utf-8');
//             return res.status(400).send('Invalid language');
//         }
//         const products = await Product.find({}, { slug: 1, updatedAt: 1 });
//         if (!products.length) {
//             res.setHeader('Content-Type', 'application/xml; charset=utf-8');
//             return res
//                 .status(404)
//                 .send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
//         }
//         const urls = products
//             .map((product) => {
//                 const currentSlug = product.slug?.[currentLanguage.code];
//                 if (!currentSlug) return null;
//                 const mainUrl = `${SITE_URL}/${lang}/product/${currentSlug}`;
//                 const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
//                 return `<url><loc>${mainUrl}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`;
//             })
//             .filter(Boolean)
//             .join('');
//         const finalXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
//         res.setHeader('Content-Type', 'application/xml; charset=utf-8');
//         // res.setHeader('Cache-Control', 'public, max-age=86400');
//         res.send(finalXml);
//     } catch (err) {
//         console.error('Error generating language sitemap:', err);
//         res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
//     }
// };

export const generateSitemapForLangPart = async (req, res) => {
    try {
        const { lang } = req.params;
        const currentLanguage = await Language.findOne({ urlCode: lang });
        if (!currentLanguage) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(400).send('Invalid language');
        }

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

        const cursor = Product.find({}, { slug: 1, updatedAt: 1 }).lean().cursor();
        let found = false;
        for await (const product of cursor) {
            const currentSlug = product.slug?.[currentLanguage.code];
            if (!currentSlug) continue;
            found = true;
            const mainUrl = `${SITE_URL}/${lang}/product/${currentSlug}`;
            const lastmod = new Date(product.updatedAt).toISOString().split('T')[0];
            res.write(`<url><loc>${mainUrl}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
        }
        res.write('</urlset>');
        res.end();

        if (!found) {
            // Якщо жодного товару — віддати пустий sitemap
            // (але ця логіка тут не потрібна, бо все одно віддається urlset)
        }
    } catch (err) {
        console.error('Error generating language sitemap:', err);
        if (!res.headersSent) {
            res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>');
        } else {
            res.end();
        }
    }
};

/**
 * Генерація Google Merchant Feed XML для конкретної мови
 * URL: /googlefid-:lang.xml
 * :lang — urlCode мови (наприклад, uk, en, pl)
 */

export const generateGoogleXML = async (req, res) => {
    try {
        const { lang } = req.params;
        const language = await Language.findOne({ urlCode: lang });
        if (!language) {
            return res.status(404).send('Language not found');
        }
        const code = language.code;
        const currency = language.currency;

        // Курс валют (раз на запит)
        let usdToCurrencyRate = 1;
        if (currency !== 'USD') {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await axios.get(`https://minfin.com.ua/api/coin/day/usd/${currency.toLowerCase()}/${today}`);
                usdToCurrencyRate = Number(response.data.data[0].course) || 1;
            } catch (e) {
                console.error('⚠️ Помилка отримання курсу валюти:', e.message);
                usdToCurrencyRate = 1;
            }
        }

        // Хелпер для заміни хоста у зображенні
        const replaceImageHost = (url) => normalizeImageUrl(url);

        // Кеш-контейнери для одного запиту (щоб не ходити у Redis двічі за одну feed-генерацію)
        const categoryCache = {};
        const subCategoryCache = {};
        const subSubCategoryCache = {};

        // Функція кешування назви/опису категорій (Redis + локальний кеш)
        const getCachedCategoryName = async (model, id, type) => {
            if (!id) return '';

            // Перевір локальний in-request cache (швидкий)
            if (type === 'cat' && categoryCache[id]) return categoryCache[id];
            if (type === 'sub' && subCategoryCache[id]) return subCategoryCache[id];
            if (type === 'subsub' && subSubCategoryCache[id]) return subSubCategoryCache[id];

            // Перевір Redis кеш (якщо доступний)
            if (redis) {
                try {
                    const cacheKey = `cat:${type}:${id}:${code}`;
                    const cached = await redis.get(cacheKey);
                    if (cached) {
                        // Зберігаємо в локальний кеш для цього запиту
                        if (type === 'cat') categoryCache[id] = cached;
                        if (type === 'sub') subCategoryCache[id] = cached;
                        if (type === 'subsub') subSubCategoryCache[id] = cached;
                        return cached;
                    }
                } catch (redisError) {
                    console.error('Redis get error:', redisError.message);
                    // При помилці Redis - продовжуємо без нього
                }
            }

            // Шукаємо у базі
            let doc = await model.findById(id, { [`name.${code}`]: 1, [`description.${code}`]: 1 });
            let result = doc?.name?.[code] || '';

            // Зберігаємо в Redis (якщо доступний)
            if (redis) {
                try {
                    const cacheKey = `cat:${type}:${id}:${code}`;
                    await redis.setex(cacheKey, 5 * 24 * 60 * 60, result); // 5 днів
                } catch (redisError) {
                    console.error('Redis set error:', redisError.message);
                    // При помилці Redis - продовжуємо без нього
                }
            }

            // Локально кешуємо для цього запиту
            if (type === 'cat') categoryCache[id] = result;
            if (type === 'sub') subCategoryCache[id] = result;
            if (type === 'subsub') subSubCategoryCache[id] = result;
            return result;
        };

        const getAllCategory = async (categoryId, subCategoryId, subSubCategoryId) => {
            const category = await getCachedCategoryName(Category, categoryId, 'cat');
            const sub_category = await getCachedCategoryName(SubCategory, subCategoryId, 'sub');
            const sub_sub_category = await getCachedCategoryName(SubSubCategory, subSubCategoryId, 'subsub');
            return [category, sub_category, sub_sub_category].filter(Boolean).join(' > ');
        };

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.write(
            '<?xml version="1.0" encoding="UTF-8"?>' +
                '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' +
                '<channel>' +
                `<title>Alistar Feed (${lang})</title>` +
                `<link>${SITE_URL}/${lang}/</link>` +
                `<description>Google Merchant Feed for language ${lang}</description>`,
        );

        // Стрімімо товари курсором
        const cursor = Product.find(
            { isGoogleMerchant: { $ne: false }, [`name.${code}`]: { $exists: true, $ne: '' } },
            {
                [`name.${code}`]: 1,
                [`description.${code}`]: 1,
                [`slug.${code}`]: 1,
                price: 1,
                images: 1,
                part_number: 1,
                sku: 1,
                category: 1,
                sub_categories: 1,
                availability: 1,
            },
        )
            .populate('availability')
            .lean()
            .cursor();

        for await (const product of cursor) {
            const slug = product.slug?.[code] || '';
            const url = `${SITE_URL}/${lang}/product/${slug}`;
            const image = replaceImageHost(Array.isArray(product.images) && product.images.length > 0 ? product.images[0]?.path : '');

            // Ціна в валюті
            let finalPrice = product.price;
            if (currency !== 'USD') {
                finalPrice = +(product.price * usdToCurrencyRate).toFixed(2);
            }

            const productType = await getAllCategory(product.category?.[0], product.category?.[1], product.category?.[2]);

            // Генерація item XML
            res.write('<item>');
            res.write(`<g:id>${product._id}</g:id>`);
            res.write(`<g:title>${escapeXML(product.name?.[code] || '')}</g:title>`);
            res.write('<g:availability>in stock</g:availability>');
            res.write(`<g:price>${finalPrice} ${currency}</g:price>`);
            res.write('<g:brand>Alistar</g:brand>');
            res.write(`<g:mpn>${escapeXML(product.part_number || '')}</g:mpn>`);
            res.write('<g:condition>new</g:condition>');
            res.write('<g:identifier_exists>false</g:identifier_exists>');
            res.write(`<g:product_type>${escapeXML(productType)}</g:product_type>`);
            res.write(`<g:description>${escapeXML(product.description?.[code] || '')}</g:description>`);
            res.write(`<g:image_link>${image}</g:image_link>`);
            if (Array.isArray(product.images) && product.images.length > 1) {
                product.images
                    .slice(1)
                    .map((img) => replaceImageHost(img.path))
                    .filter((link) => !!link)
                    .forEach((link) => {
                        res.write(`<g:additional_image_link>${link}</g:additional_image_link>`);
                    });
            }
            res.write(`<g:link>${url}</g:link>`);
            res.write('</item>');
        }

        res.write('</channel></rss>');
        res.end();

        // escapeXML для безпеки (мінімальний)
        function escapeXML(str) {
            return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    } catch (err) {
        console.error('generateGoogleXML error:', err);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        } else {
            res.end();
        }
    }
};
