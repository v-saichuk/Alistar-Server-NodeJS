import { validationResult } from 'express-validator';
import Language from '../../models/Language.js';
// import geoip from 'geoip-lite';

export const getAll = async (req, res) => {
    try {
        // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // const ip = '91.218.13.228'; // Ukraine
        // const ip = '87.249.132.144'; // Germany
        // const ip = '156.146.59.40'; // USA
        // const ip = '84.239.14.169'; // Romania
        // const ip = '89.187.163.163'; // Singapur

        // const userCountry = geoip.lookup(ip);
        // const countriCode = userCountry !== null ? userCountry.country : process.env.DEFAULT_USER_LANGUAGE;
        const languages = await Language.find().sort({ position: 1 });
        // const selectedLanguage =
        //     languages.find((lang) => lang.code === countriCode) || languages.find((lang) => lang.code === process.env.DEFAULT_USER_LANGUAGE);

        res.json({ languages });
        // res.json({ languages, selectedLanguage });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch languages!',
            err,
        });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const lang = await Language.create({ ...req.body });

        res.json({
            data: await Language.findById(lang._id),
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Виникла помилка при створені нової мови!',
            err,
        });
    }
};

export const update = async (req, res) => {
    try {
        const languageId = req.params.id;

        await Language.findByIdAndUpdate(languageId, { ...req.body });

        const languages = await Language.find().sort({ position: 1 });

        res.json({
            success: true,
            languages,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не вдалось оновити мову!',
            error: err,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const { id: LANGUAGE_ID } = req.params;
        const deletedLanguage = await Language.findByIdAndDelete(LANGUAGE_ID);

        if (!deletedLanguage) {
            return res.status(404).json({
                success: false,
                message: 'Помилка. Мову не знайдено!',
            });
        }
        res.json({
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};
