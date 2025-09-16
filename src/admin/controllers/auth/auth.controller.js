import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import geoip from 'geoip-lite';
import axios from 'axios';
import User from '../../../shared/models/User.js';

export const Login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).populate({
            path: 'role',
            select: 'color title is_admin_panel',
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

        if (!user.role || !user.role.is_admin_panel) {
            return res.status(403).json({
                success: false,
                message: 'Access denied!',
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

export const LoginWithGoogle = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: "Код авторизації є обов'язковим" });
        }

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { sub: googleId, email, picture: avatar } = userInfoResponse.data;

        let user = await User.findOne({ $or: [{ googleId }, { email }] }).populate({
            path: 'role',
            select: 'color title is_admin_panel',
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Користувача не знайдено!',
            });
        }

        if (!user.role || !user.role.is_admin_panel) {
            return res.status(403).json({
                success: false,
                message: 'Доступ заборонено!',
            });
        }

        if (!user.googleId) {
            user.googleId = googleId;
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save();
        }

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
        console.error('Google OAuth Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Не вдалося авторизувати користувача через Google.',
        });
    }
};
