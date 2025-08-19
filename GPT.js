import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getSupportEmail(websiteUrl) {
    const messages = [
        {
            role: 'system',
            content: 'Ти бот, який знаходить email підтримки на сайті, якщо такий вказаний. ',
        },
        {
            role: 'user',
            content: `Перейди на сайт ${websiteUrl} та знайди email підтримки. Якщо нема — скажи "Email не вказано". Якщо є, без зайвих слів поверни лише email`,
        },
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0,
    });

    const result = response.choices[0].message.content;
    console.log('Результат:', result);
}

// getSupportEmail('https://www.andorratelecom.ad');

// Хакаємо зашифровку email
function decodeCfEmail(encoded) {
    const hexToBytes = (hex) => {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    };

    const data = hexToBytes(encoded);
    const key = data[0];
    let email = '';
    for (let i = 1; i < data.length; i++) {
        email += String.fromCharCode(data[i] ^ key);
    }
    return email;
}

// приклад використання
// const encoded = 'abcccfcac8c0caebdec5c885dbc7';
// console.log(decodeCfEmail(encoded)); // поверне розшифрований email
