import Template from '../../../shared/models/Template.js';
import Language from '../../../shared/models/Language.js';

export const getOne = async (req, res) => {
    try {
        const TEMPLATE_PAGE_ID = req.params.id;
        const template = await Template.findById(TEMPLATE_PAGE_ID);
        const data = {
            _id: template?._id,
            name: template?.name,
            sections: template?.sections.filter((section) => section.status),
            language: template?.language,
        };

        const languages = await Language.find();

        res.json({ data, languages });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to get Template page',
        });
    }
};
