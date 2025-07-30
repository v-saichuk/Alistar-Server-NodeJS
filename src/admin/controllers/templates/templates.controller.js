import { validationResult } from 'express-validator';
import Template from '../../../shared/models/Template.js';

export const getAll = async (req, res) => {
    try {
        const templates = await Template.find();

        res.json(templates);
    } catch (error) {
        res.status(500).json({
            success: false,
            error,
        });
    }
};

export const create = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }
        const template = await Template.create({ ...req.body });
        const data = await Template.findById(template._id);
        res.json({
            success: true,
            template: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error,
        });
    }
};

export const update = async (req, res) => {
    try {
        const { id: TEMPLATE_PAGE_ID } = req.params;
        const { name } = req.body;

        await Template.updateOne({ _id: TEMPLATE_PAGE_ID }, { name });

        const template = await Template.findById(TEMPLATE_PAGE_ID);

        return res.json({
            success: true,
            template,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const { id: TEMPLATE_PAGE_ID } = req.params;
        const deleteTemplate = await Template.findByIdAndDelete(TEMPLATE_PAGE_ID);

        if (!deleteTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Template Page not found!',
            });
        }

        res.json({
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error,
        });
    }
};
