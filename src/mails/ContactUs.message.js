import nodemailer from 'nodemailer';
import SettingsEmail from '../shared/models/Settings.email.js';

export const ContactUsMessage = async (fullname, email, subject, message) => {
    const { auth, host, port, secure } = await SettingsEmail.findOne();
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: auth.no_reply.user,
            pass: auth.no_reply.pass,
        },
    });

    const mailOptions = {
        from: `"Alistar HK LTD" <${auth.no_reply.user}>`,
        to: 'support@alistar.ltd',
        subject: 'Новий запит через форму Contact:',
        html: `
        <p><strong>Ім'я користувача:</strong> ${fullname}</p>
        <p><strong>Email користувача:</strong> ${email}</p>
        <p><strong>Тема:</strong> ${subject}</p>
        <p><strong>Повідомлення:</strong></p>
        <p>${message}</p>
        `,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email sending error:', error);
                return reject(error);
            }
            console.log('Thank you, your email has been successfully sent.', info.response);
            resolve(true); // Успішна відправка повертає `true`
        });
    });
};
