import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { NewUserMessage } from '../mails/NewUser.message.js';

// Функція для створення нового користувача
export const createNewUser = async (firstName, lastName, email, ip = '') => {
    // Генерація пароля
    const newPass = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    const newUser = new User({
        ip,
        avatar: '',
        firstName,
        lastName,
        email,
        role: process.env.USER_REGISTER_DEFAULT_ROLE,
        passwordHash,
    });

    await newUser.save();

    // Надіслати email
    try {
        await NewUserMessage(email, firstName, newPass);
    } catch (error) {
        console.error('Помилка відправки повідомлення:', error);
        throw new Error('Помилка відправки email');
    }

    return newUser;
};
