import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import geoip from 'geoip-lite';
import User from '../../../shared/models/User.js';

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
