import mongoose from 'mongoose';
import Template from '../../../../shared/models/Template.js';
import Landing from '../../../../shared/models/Order.js';
import { validationResult } from 'express-validator';

export const create = async (req, res) => {
    try {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const TEMPLATE_PAGE_ID = req.body.templateId;
        const IS_CHECKED = req.body.isChecked;

        const template = await Template.findById(TEMPLATE_PAGE_ID);
        const section = req.body;

        const newSection = { ...section, _id: new mongoose.Types.ObjectId() };

        await Template.updateOne({ _id: TEMPLATE_PAGE_ID }, { sections: [...template.sections, newSection] });

        if (IS_CHECKED) {
            await Landing.updateMany({ template_pack: TEMPLATE_PAGE_ID }, { $push: { sections: newSection } });
        }

        const templateOne = await Template.findOne({ _id: TEMPLATE_PAGE_ID });
        const sectionOne = templateOne.sections.find((s) => s._id.toString() === newSection._id.toString());

        return res.json({
            success: true,
            section: sectionOne,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

export const update = async (req, res) => {
    try {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }
        const { templateId, sectionId, title, isChecked } = req.body;

        // Первіряємо поля на наявність інформації.
        if (!templateId || !sectionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Оновлюємо назву секції в Template.
        const updatedTemplate = await Template.findOneAndUpdate(
            { _id: templateId, 'sections._id': sectionId },
            { $set: { 'sections.$.title': title } },
            { new: true, select: { sections: { $elemMatch: { _id: sectionId } } } },
        );

        if (!updatedTemplate) {
            return res.status(404).json({ message: 'Landing or section not found' });
        }

        // Якщо галочка встановлена тоді оновлюємо назву увсіх залежних Landing page => section
        if (isChecked) {
            await Landing.updateMany({ template_id: templateId, 'sections._id': sectionId }, { $set: { 'sections.$.title': title } });
        }

        const section = updatedTemplate.sections[0];

        res.json({
            success: true,
            section: {
                id: section._id,
                title: section.title,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const { templatePageId, sectionId, isChecked } = req.body;

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        // Первіряємо поля на наявність інформації.
        if (!templatePageId || !sectionId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Видаляємо section в Template page.
        await Template.updateOne({ _id: templatePageId }, { $pull: { sections: { _id: sectionId } } });

        // Перевіряємо чи встановлена галочка, якщо встановлена, також видаляємо section у всіх Landing page.
        if (isChecked) {
            await Landing.updateMany({ template_pack: templatePageId }, { $pull: { sections: { _id: sectionId } } });
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

export const position = async (req, res) => {
    try {
        const { template_id, sections } = req.body;

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }
        await Template.updateOne({ _id: template_id }, { sections });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { template_id, section_id } = req.params;
        const { status } = req.body;

        const error = validationResult(req);
        if (!error.isEmpty()) return res.status(400).json(error.array());

        await Template.updateOne({ _id: template_id, 'sections._id': section_id }, { $set: { 'sections.$.status': status } });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

export const updateStatusLendingSection = async (req, res) => {
    try {
        const { template_id, section_id } = req.params;
        const { status } = req.body;

        const error = validationResult(req);
        if (!error.isEmpty()) return res.status(400).json(error.array());

        await Landing.updateMany({ template_pack: template_id, 'sections._id': section_id }, { $set: { 'sections.$.status': status } });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
