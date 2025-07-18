/**
 * Генерує унікальне 7-значне число
 * Гарантує унікальність завдяки рандомній генерації з перевіркою
 * @param {ObjectId|string} objectId - ObjectId замовлення (не використовується, але зберігається для сумісності)
 * @returns {string} Унікальне 7-значне число
 */
export function generateUniqueNumber(objectId) {
    // Генеруємо рандомне 7-значне число
    const min = 1000000; // 7 цифр (від 1000000)
    const max = 9999999; // до 9999999
    const uniqueNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return uniqueNumber.toString();
}

/**
 * Генерує унікальний orderId з перевіркою в базі даних
 * @param {Object} Order - Модель замовлення з бази даних
 * @returns {Promise<string>} Унікальний orderId
 */
export async function generateUniqueOrderId(Order) {
    let orderId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100; // Максимальна кількість спроб

    while (!isUnique && attempts < maxAttempts) {
        // Генеруємо новий orderId
        orderId = generateUniqueNumber();

        try {
            // Перевіряємо чи існує такий orderId в базі
            const existingOrder = await Order.findOne({ orderId: orderId });

            if (!existingOrder) {
                // orderId унікальний, можна використовувати
                isUnique = true;
            } else {
                // orderId вже існує, генеруємо новий
                attempts++;
            }
        } catch (error) {
            console.error('Помилка при перевірці унікальності orderId:', error);
            throw error;
        }
    }

    if (!isUnique) {
        throw new Error('Не вдалося згенерувати унікальний orderId після максимальної кількості спроб');
    }

    return orderId;
}
