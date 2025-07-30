import { validationResult } from 'express-validator';
import Language from '../../../shared/models/Language.js';

export const getAll = async (req, res) => {
    try {
        const languages = await Language.find().sort({ position: 1 });
        res.json({ languages });
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
