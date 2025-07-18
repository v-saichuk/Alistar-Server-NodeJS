import Products from '../../models/Product.js';
import Users from '../../models/User.js';
import Orders from '../../models/Order.js';

// Функція для обрахунку замовлень за сьогодні
const countTodayOrders = (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Обнулити час

    return orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    }).length;
};

export const getAll = async (_, res) => {
    try {
        // Виконуємо запити паралельно
        const [productCount, userCount, orders] = await Promise.all([Products.find().countDocuments(), Users.find().countDocuments(), Orders.find()]);

        const data = {
            products: productCount,
            users: userCount,
            orders: {
                all: orders.length,
                today: countTodayOrders(orders),
            },
        };

        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
