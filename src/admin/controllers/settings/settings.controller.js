import SettingsEmail from '../../../shared/models/Settings.email.js';

export const getAll = async (req, res) => {
    try {
        const EmailData = await SettingsEmail.findOne();
        res.json(EmailData);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error!',
        });
    }
};

export const update = async (req, res) => {
    try {
        const { port, ...other } = req.body;
        const portNumber = Number(port);

        const EmailData = await SettingsEmail.findOne();

        if (!!EmailData) {
            await SettingsEmail.updateOne({ _id: EmailData._id }, { ...other, port: portNumber });
        } else {
            await SettingsEmail.create({ ...other, port: portNumber });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
