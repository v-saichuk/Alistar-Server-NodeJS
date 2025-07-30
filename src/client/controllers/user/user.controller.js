import User from '../../../shared/models/User.js';
import { createNewUser } from '../../../shared/utils/createNewUser.js';

export const updateUserClient = async (req, res) => {
    try {
        const { userId, shipping, billing, isBilling } = req.body;
        const firstName = shipping?.firstName;
        const lastName = shipping?.lastName;
        const shippingEmail = shipping?.email || billing?.email;

        let user;

        // Якщо userId є, шукаємо користувача за id
        if (userId) {
            user = await User.findById(userId);
        }

        // Якщо userId немає, перевіряємо за email
        if (!user && shippingEmail) {
            user = await User.findOne({ email: shippingEmail });
        }

        // Якщо користувача немає, створюємо нового
        if (!user) {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            user = await createNewUser(firstName, lastName, shippingEmail, ip);
        }

        // Оновлення даних користувача
        const updateData = {
            ...(shipping && { 'address.shipping': shipping }),
            ...(billing && { 'address.billing': billing }),
            ...(isBilling !== undefined && { 'address.isBilling': isBilling }),
        };

        let result;
        if (Object.keys(updateData).length) {
            result = await User.findOneAndUpdate({ _id: user._id }, { $set: updateData }, { new: true });
        }

        res.json({
            success: true,
            address: result?.address || user.address,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err,
        });
    }
};
