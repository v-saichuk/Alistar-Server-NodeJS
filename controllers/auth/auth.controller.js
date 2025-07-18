import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import geoip from 'geoip-lite';
import axios from 'axios';
import User from '../../models/User.js';
import { ForgotPasswordMessage } from '../../mails/ForgotPassword.message.js';
import { NewUserMessage } from '../../mails/NewUser.message.js';
import { AuthUserMessage } from '../../mails/AuthUser.message.js';
import { createNewUser } from '../../utils/createNewUser.js';

export const Login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).populate({
            path: 'role',
            select: 'color title',
        });
        if (!user) {
            return res.status(404).json({
                seccess: false,
                message: 'User not found!',
            });
        }

        const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPass) {
            return res.status(400).json({
                seccess: false,
                message: 'Invalid e-mail or password',
            });
        }

        // const ip = '91.218.13.228';
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (user.ip !== ip) {
            const userGeo = geoip.lookup(ip) || '';
            const userAgent = req.headers['user-agent'];
            //TODO: Увімкнути повідомлення про авторизацію користувача
            // await AuthUserMessage(userGeo, userAgent, user.email, ip);
            user.ip = ip;
            await user.save();
        }

        const token = jwt.sign(
            {
                _id: user._id,
            },
            process.env.SECRET_KEY,
            {
                expiresIn: '30d',
            },
        );

        const { passwordHash, ...userData } = user._doc;

        res.json({
            user: { ...userData },
            token,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'An error occurred during authorization!',
        });
        console.log('Auth Error =>', err);
    }
};

export const Register = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        const person = await User.findOne({ email });

        if (person) {
            return res.status(409).json({
                success: false,
                message: 'The user with this email is already registered!',
            });
        }

        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Викликаємо спільну функцію
        await createNewUser(firstName, lastName, email, ip);

        res.json({
            success: true,
            message: `Registration successful, login details have been sent to your email address ${email}!`,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error creating user. Please try again later.',
        });
    }
};

export const ForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email }).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!',
            });
        }

        // Генерація нового пароля
        const newPass = crypto.randomBytes(4).toString('hex');

        // Хешування пароля перед збереженням
        const passwordHash = await bcrypt.hash(newPass, 10);
        user.passwordHash = passwordHash;

        // Збереження нового пароля у базу даних
        await user.save();

        try {
            // Надсилання email із новим паролем
            await ForgotPasswordMessage(user.email, user.firstName, newPass);
            res.json({
                success: true,
                message: `A new password has been sent to the email ${email}!`,
            });
        } catch (error) {
            console.error('Помилка відправки повідомлення:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send email. Please try again later.',
            });
        }
    } catch (err) {
        console.error('Forgot Password Error =>', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred!',
        });
    }
};

export const LoginWithGoogle = async (req, res) => {
    try {
        const { code, languageId } = req.body; // Отримуємо код авторизації з клієнта

        // Обмін коду авторизації на токени через API Google
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'postmessage', // Використовуємо "postmessage" для безредіректної авторизації
            grant_type: 'authorization_code',
        });

        const { id_token, access_token } = tokenResponse.data;

        // Отримуємо інформацію про користувача через Google API
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = userInfoResponse.data;

        // Перевіряємо, чи користувач уже існує
        let user = await User.findOne({ googleId }).populate({
            path: 'role',
            select: 'color title',
        });

        if (!user) {
            // Якщо користувача немає, шукаємо за email
            user = await User.findOne({ email }).populate({
                path: 'role',
                select: 'color title',
            });

            if (user) {
                // Якщо користувач знайдений за email, додаємо йому Google ID
                user.googleId = googleId;
                user.avatar = avatar;
                await user.save();
            } else {
                // Якщо користувача немає, створюємо нового
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                const newUser = {
                    ip,
                    avatar: avatar || '',
                    firstName: firstName || 'Google',
                    lastName: lastName || 'User',
                    email: email,
                    phone: '',
                    role: process.env.USER_REGISTER_DEFAULT_ROLE, // Роль за замовчуванням
                    passwordHash: '', // Порожній, оскільки Google користувачі не використовують паролі
                    googleId: googleId,
                    language: languageId,
                };

                const doc = new User(newUser);
                user = await doc.save();
                await user.populate({
                    path: 'role',
                    select: 'color title',
                });
            }
        }

        // Додаємо перевірку на зміну IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (user.ip !== ip) {
            // Геолокація користувача
            const userGeo = geoip.lookup(ip) || {};
            const userAgent = req.headers['user-agent'];

            // Відправлення повідомлення
            await AuthUserMessage(userGeo, userAgent, user.email, ip);

            // Оновлення IP в профілі користувача
            user.ip = ip;
            await user.save();
        }

        // Генеруємо JWT токен
        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
            },
            process.env.SECRET_KEY,
            { expiresIn: '30d' },
        );

        const { ...userData } = user._doc;

        res.json({
            user: { ...userData },
            token,
        });
    } catch (err) {
        console.error('Google OAuth Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to authorize user via Google.',
        });
    }
};
