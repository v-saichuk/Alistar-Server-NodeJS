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
