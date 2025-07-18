import { ContactUsMessage } from '../../mails/ContactUs.message.js';

export const sendMessage = async (req, res) => {
    try {
        const { fullname, email, subject, message } = req.body;

        try {
            await ContactUsMessage(fullname, email, subject, message);

            res.json({
                success: true,
                message: `Thank you for your contact, we have received your message!`,
            });
        } catch (error) {
            console.error('Помилка відправки повідомлення:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send email. Please try again later.',
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.',
        });
    }
};
