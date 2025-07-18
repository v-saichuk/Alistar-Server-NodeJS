import { WebSocketServer } from 'ws';
import OrderModel from '../models/Order.js';

export const initWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', async function connection(ws) {
        console.log('New WebSocket connection');

        // Надіслати повідомлення клієнту при підключенні
        ws.send('Connected to WebSocket server');

        ws.on('message', function incoming(message) {
            console.log('Received: %s', message);
        });

        // Функція для відправки замовлень клієнту
        const sendOrdersToClient = async () => {
            try {
                const orders = await OrderModel.find().populate('productsData.product');
                ws.send(JSON.stringify(orders.reverse()));
            } catch (error) {
                console.error('Error getting orders:', error);
                ws.send(JSON.stringify({ error: 'Error getting orders' }));
            }
        };

        // Відправити замовлення при підключенні
        await sendOrdersToClient();

        // Підписка на зміни у базі даних і відправлення нових замовлень при зміні
        const ordersChangeStream = OrderModel.watch();
        ordersChangeStream.on('change', async () => {
            await sendOrdersToClient();
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed');
            ordersChangeStream.close();
        });
    });
};
