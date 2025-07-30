import { sendNewApplicationMessage } from '../../../telegram_bot.js';
import Product from '../../../shared/models/Product.js';

export const sendOrderTelegram = async (order) => {
    // Збираємо id товарів з замовлення
    const productIds = order?.productsData?.map((item) => item.product) || [];

    // Отримуємо товари з бази та створюємо мапу для швидкого доступу
    const products = await Product.find({ _id: { $in: productIds } }, { 'name.US': 1, 'slug.US': 1, price: 1 });

    const productsMap = new Map(products.map((prod) => [prod._id.toString(), prod]));

    // Формуємо список товарів для повідомлення
    const productsList = (order?.productsData || [])
        .map((item, idx) => {
            const prod = productsMap.get(item.product.toString());
            const name = prod?.name?.US ?? `Product ${idx + 1}`;
            const url = prod ? `https://alistar.ltd/en/product/${prod.slug?.US}` : '#';
            return `• <a href="${url}">${name}</a> — ${item.qty} pcs × $${item.price} = $${item.total}`;
        })
        .join('\n');

    const message = `
🧾 <b>Order #AL${order?.orderId}</b>

<b>Payment:</b> ${
        order?.payments === 'wayforpay'
            ? 'Credit/Debit Card'
            : order?.payments === 'bank_transfer'
            ? 'Bank Transfer'
            : order?.payments === 'other'
            ? 'Other'
            : order?.payments || ''
    }
<b>Delivery:</b> ${
        order?.delivery?.title === 'dhl'
            ? 'DHL'
            : order?.delivery?.title === 'fedex_ip'
            ? 'Fedex IP'
            : order?.delivery?.title === 'ups_express_saver'
            ? 'UPS Express Saver IP'
            : order?.delivery?.title === 'other'
            ? 'Other'
            : order?.delivery?.title || ''
    }

🚚 <b>Shipping:</b>
<b>Name:</b> ${order?.shipping?.first_name} ${order?.shipping?.last_name}
<b>Phone:</b> ${order?.shipping?.phone}
<b>Email:</b> ${order?.shipping?.email}
<b>Address:</b> ${order?.shipping?.address}${order?.shipping?.address_2 ? ', ' + order?.shipping?.address_2 : ''}
<b>City:</b> ${order?.shipping?.city}, ${order?.shipping?.country}, ${order?.shipping?.post_code}
<b>State/Province:</b> ${order?.shipping?.state}

🛒 <b>Products:</b>
${productsList}

💰 <b>Total:</b> $${order?.totalCost || 0}

📅 <b>Створено:</b> ${order?.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : '-'} 
`;

    sendNewApplicationMessage(message, [{ text: 'View in Admin', url: `https://admin.alistar.ltd/order/${order?._id}` }]);
};

// order {
//     orderId: '6661641',
//     visited: false,
//     payments: 'bank_transfer',
//     delivery: { title: 'fedex_ip', tracking: '' },
//     shipping: {
//       first_name: 'Vitalli',
//       last_name: 'Kovalenko',
//       phone: '+380931234567',
//       email: 'v.saic4uk@gmail.com',
//       address: '123 Main St',
//       address_2: 'Apt 4B',
//       address_type: 'Residential',
//       city: 'Kyiv',
//       country: 'Bulgaria',
//       post_code: '04001',
//       state: 'Silistra Province',
//       company_name: '',
//       tax_number: ''
//     },
//     billing: {
//       use_shipping_address: true,
//       first_name: '',
//       last_name: '',
//       phone: '',
//       address: '',
//       address_2: '',
//       address_type: '',
//       city: '',
//       company_name: '',
//       country: '',
//       post_code: '',
//       state: ''
//     },
//     productsData: [
//       {
//         product: new ObjectId("6727e1d9e296a276d80bcd94"),
//         qty: 6,
//         price: 18,
//         total: 108,
//         _id: new ObjectId("687e2a608963531f3c9231a7")
//       },
//       {
//         product: new ObjectId("6727e4c7e296a276d80bcdac"),
//         qty: 3,
//         price: 18,
//         total: 54,
//         _id: new ObjectId("687e2a608963531f3c9231a8")
//       },
//       {
//         product: new ObjectId("6727e5bde296a276d80bcdcb"),
//         qty: 1,
//         price: 20,
//         total: 20,
//         _id: new ObjectId("687e2a608963531f3c9231a9")
//       }
//     ],
//     status: new ObjectId("67575f1bcbc5755882a2c47f"),
//     totalCost: 182,
//     statusHistory: [
//       {
//         status: 'Pending',
//         date: 2025-07-21T11:54:08.075Z,
//         _id: new ObjectId("687e2a608963531f3c9231aa")
//       }
//     ],
//     _id: new ObjectId("687e2a608963531f3c9231a6"),
//     createdAt: 2025-07-21T11:54:08.128Z,
//     updatedAt: 2025-07-21T11:54:08.128Z,
//     __v: 0
//   }
