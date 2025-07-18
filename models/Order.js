import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
    {
        visited: {
            type: Boolean,
            default: false,
        },
        payment: String,
        delivery: {
            title: {
                type: String,
                default: 'Standard',
            },
            tracking: {
                type: String,
                default: '',
            },
        },
        shipping: {
            first_name: {
                type: String,
                required: true,
            },
            last_name: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
            address_2: {
                type: String,
                default: '',
            },
            address_type: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            company_name: {
                type: String,
                default: '',
            },
            country: {
                type: String,
                required: true,
            },
            post_code: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            tax_number: {
                type: String,
                required: true,
            },
        },
        billing: {
            use_shipping_address: {
                type: Boolean,
                default: true,
            },
            first_name: {
                type: String,
                default: '',
            },
            last_name: {
                type: String,
                default: '',
            },
            phone: {
                type: String,
                default: '',
            },
            address: {
                type: String,
                default: '',
            },
            address_2: {
                type: String,
                default: '',
            },
            address_type: {
                type: String,
                default: '',
            },
            city: {
                type: String,
                default: '',
            },
            company_name: {
                type: String,
                default: '',
            },
            country: {
                type: String,
                default: '',
            },
            post_code: {
                type: String,
                default: '',
            },
            state: {
                type: String,
                default: '',
            },
        },
        productsData: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                qty: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
                total: {
                    type: Number,
                    required: true,
                },
            },
        ],
        status: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderStatus',
            default: '67575f1bcbc5755882a2c47f', // Pending status ID
        },
        totalCost: {
            type: Number,
            required: true,
            min: 0,
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    required: true,
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Order', OrderSchema);

// - Pending (Очікує підтвердження):
// Коли замовлення створене, але ще не оплачено.
// Для випадків з Bank Transfer, це буде статус до моменту отримання платежу.

// -Paid (Оплачено):
// Замовлення успішно оплачено (PayPal або карткою).
// Для Bank Transfer цей статус змінюється вручну після перевірки оплати.

// - Processing (В обробці):
// Замовлення перебуває у стадії підготовки (наприклад, збір товарів для відправки).

// - Shipped (Відправлено):
// Замовлення відправлене клієнту.
// Ви можете додати посилання на трекінг (якщо доступне).

// - Completed (Завершено):
// Замовлення доставлено, і клієнт підтвердив отримання (або після певного періоду замовлення автоматично позначається завершеним).

// - Cancelled (Скасовано):
// Замовлення скасовано клієнтом або адміністратором до його обробки.

// - Failed (Помилка):
// Оплата не вдалася (наприклад, проблеми з PayPal або карткою).
// Цей статус актуальний для онлайн-оплат.

// - Refunded (Повернення):
// Замовлення було повернене клієнтом, і кошти відшкодовані.
