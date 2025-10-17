import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SettingsEmail from '../../shared/models/Settings.email.js';
import Product from '../../shared/models/Product.js';
import { normalizeSmallImageUrl } from '../../shared/utils/normalizeImageUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функція для заміни плейсхолдерів у HTML
function replacePlaceholders(template, data) {
    let result = template;

    // Заміна простих плейсхолдерів
    Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'string' || typeof data[key] === 'number') {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, data[key]);
        }
    });

    // Заміна циклів для товарів
    if (data.orderItems && Array.isArray(data.orderItems)) {
        const itemTemplate = result.match(/{{#each orderItems}}([\s\S]*?){{\/each}}/);
        if (itemTemplate) {
            const itemHtml = itemTemplate[1];
            const itemsHtml = data.orderItems
                .map((item) => {
                    let itemResult = itemHtml;
                    Object.keys(item).forEach((key) => {
                        const placeholder = new RegExp(`{{${key}}}`, 'g');
                        itemResult = itemResult.replace(placeholder, item[key]);
                    });
                    return itemResult;
                })
                .join('');

            result = result.replace(/{{#each orderItems}}[\s\S]*?{{\/each}}/, itemsHtml);
        }
    }

    return result;
}

async function prepareOrderData(order) {
    // Формуємо список товарів для шаблону
    // Отримуємо всі productId з productsData
    const productIds = order.productsData.map((item) => item.product);
    // Запитуємо продукти з бази
    const products = await Product.find({ _id: { $in: productIds } }, { name: 1, slug: 1, images: 1 });

    // Хелпер нормалізації картинки (small)
    const replaceImageHost = (url) => normalizeSmallImageUrl(url);

    // Формуємо список товарів для шаблону з назвами з бази
    const orderItems = order.productsData.map((item) => {
        const product = products.find((p) => p._id.toString() === item.product.toString());
        return {
            productName: product ? product.name['US'] : 'Product',
            productLink: product ? product.slug['US'] : '',
            productImage: product ? replaceImageHost(product.images[0].path) : '',
            quantity: item.qty,
            unitPrice: `$${item.price}`,
            extPrice: `$${item.total}`,
        };
    });

    // Формуємо адреси
    const shipping = order.shipping || {};
    const billing = order.billing || {};

    return {
        // Основні дані користувача
        firstName: shipping.first_name || '',
        lastName: shipping.last_name || '',
        userEmail: shipping.email || '',

        // Дані замовлення
        orderId: order.orderId,
        // дата у форматі 2025.07.18 - 10:00
        orderDate: order.createdAt
            ? (() => {
                  const d = new Date(order.createdAt);
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  const hours = String(d.getHours()).padStart(2, '0');
                  const minutes = String(d.getMinutes()).padStart(2, '0');
                  return `${year}.${month}.${day} - ${hours}:${minutes}`;
              })()
            : '',

        // Товари
        orderItems,

        // Суми
        subtotal: `$${(order.totalCost || 0).toFixed(2)}`,
        shipping: '$0.00', // Якщо є окремо — підставити
        grandTotal: `$${(order.totalCost || 0).toFixed(2)}`,

        // Спосіб оплати
        paymentMethod:
            (order.payments === 'wayforpay' && 'Credit/Debit Card') ||
            (order.payments === 'bank_transfer' && 'Bank Transfer') ||
            (order.payments === 'other' && 'Other'),

        // Коментар
        comment: order.comment || '',

        // Білінгова адреса
        billingName: billing.first_name ? `${billing.first_name} ${billing.last_name}`.trim() : `${shipping.first_name} ${shipping.last_name}`.trim(),
        billingAddress: [
            billing.address || shipping.address,
            billing.city || shipping.city,
            billing.state || shipping.state,
            billing.country || shipping.country,
            billing.post_code || shipping.post_code,
        ]
            .filter(Boolean)
            .join('<br/>'),
        billingPhone: billing.phone || shipping.phone || '',

        // Адреса доставки
        shippingName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim(),
        shippingAddress: [shipping.address, shipping.city, shipping.state, shipping.country, shipping.post_code].filter(Boolean).join('<br/>'),
        shippingPhone: shipping.phone || '',
        shippingMethod:
            (order.delivery.title === 'DHL' && 'DHL') ||
            (order.delivery.title === 'fedex_ip' && 'Fedex IP') ||
            (order.delivery.title === 'ups_express_saver' && 'UPS Express Saver IP') ||
            (order.delivery.title === 'other' && 'Other'),
    };
}

export const NewUserOrderMessage = async (order) => {
    const { auth, host, port, secure } = await SettingsEmail.findOne();
    const unsubscribeUrl = `https://alistar.ltd/unsubscribe?email=${encodeURIComponent(order.shipping.email)}`;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: true,
        auth: {
            user: auth.no_reply.user,
            pass: auth.no_reply.pass,
        },
        tls: { servername: 'alistar.ltd' },
    });

    // Читаємо HTML шаблон
    const templatePath = path.join(__dirname, 'index.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Підготовка даних для шаблону
    const orderData = await prepareOrderData(order);

    // Замінюємо плейсхолдери на реальні дані
    const htmlContent = replacePlaceholders(htmlTemplate, orderData);

    // ====== SEND INFORMATION TO MAIL ======
    const mailOptions = {
        from: `"Alistar HK LTD" <${auth.no_reply.user}>`,
        to: order.shipping.email,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        subject: 'Your order has been successfully placed – Thank you!',
        html: htmlContent,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Помилка відправки листа:', error);
                return reject(error);
            }
            console.log('Лист відправлено:', info.response);
            resolve(true); // Успішна відправка повертає `true`
        });
    });

    // ====== ./SEND INFORMATION TO MAIL ======
};
