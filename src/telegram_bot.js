import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// Замініть на ваш токен, отриманий від BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Створення бота
const bot = new TelegramBot(token, { polling: false });

// Ідентифікатор групи (замініть на ваш ідентифікатор групи)
const chatId = process.env.TELEGRAM_CHAT_ID;

// Функція для надсилання повідомлення про нову заявку
export const sendNewApplicationMessage = async (applicationDetails, buttonArr) => {
    const message = applicationDetails;
    bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [buttonArr],
        },
    });
};

// Приклад виклику функції
// sendNewApplicationMessage("Ім'я: Іван Іванов\nТелефон: +380123456789\nПослуга: Ремонт комп'ютера");

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Бот активовано. Ви будете отримувати повідомлення про нові заявки.', { parse_mode: 'HTML' });
});

// Обробка інших повідомлень
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Дякуємо за ваше повідомлення!', { parse_mode: 'HTML' });
});
