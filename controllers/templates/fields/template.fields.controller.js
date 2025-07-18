import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Template from '../../../models/Template.js';
import Landing from '../../../models/Order.js';

export const create = async (req, res) => {
    try {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const { main_id, section_id, information, content } = req.body;

        const newField = {
            _id: new mongoose.Types.ObjectId(),
            field_type: information.field_type,
            field_name: information.field_name,
            content,
        };

        await Template.updateOne(
            { _id: main_id, 'sections._id': section_id },
            { $push: { 'sections.$.fields': newField } },
        );

        res.json({
            success: true,
            message: 'Template Section Field Created!',
            field: newField,
        });
    } catch (err) {
        console.log('Template Section Error =>', err);
        res.status(500).json({
            success: false,
            message: 'Template Section Error Created',
        });
    }
};

export const update = async (req, res) => {
    try {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const { main_id, section_id, fieldId, information, content, isChecked } = req.body;

        await Template.findOneAndUpdate(
            {
                _id: main_id,
                'sections._id': section_id,
                'sections.fields._id': fieldId,
            },
            {
                $set: {
                    'sections.$[section].fields.$[field]': {
                        _id: fieldId,
                        field_type: information.field_type,
                        field_name: information.field_name,
                        content: content,
                    },
                },
            },
            {
                arrayFilters: [{ 'section._id': section_id }, { 'field._id': fieldId }],
                new: true,
            },
        );

        if (isChecked) {
            await Landing.updateMany(
                {
                    template_pack: main_id,
                    'sections._id': section_id,
                    'sections.fields._id': fieldId,
                },
                {
                    $set: {
                        'sections.$[section].fields.$[field]': {
                            _id: fieldId,
                            field_type: information.field_type,
                            field_name: information.field_name,
                            content: content,
                        },
                    },
                },
                {
                    arrayFilters: [{ 'section._id': section_id }, { 'field._id': fieldId }],
                    new: true,
                },
            );
        }

        res.json({
            success: true,
            message: 'Template Section Field Updated!',
        });
    } catch (error) {
        console.log('Template Section Field Error =>', error);
        res.status(500).json({
            success: false,
            message: 'Template Section Error Updated',
        });
    }
};

export const remove = async (req, res) => {
    try {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const { mainId, sectionId, fieldId, isChecked } = req.body;

        await Template.updateOne(
            { _id: mainId },
            { $pull: { 'sections.$[s].fields': { _id: fieldId } } },
            { arrayFilters: [{ 's._id': sectionId }] },
        );

        if (isChecked) {
            await Landing.updateMany(
                { template_pack: mainId },
                { $pull: { 'sections.$[s].fields': { _id: fieldId } } },
                { arrayFilters: [{ 's._id': sectionId }] },
            );
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
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json(error.array());
        }

        const { template_id, section_id, fields } = req.body;

        await Template.findOneAndUpdate(
            {
                _id: template_id,
                'sections._id': section_id,
            },
            {
                $set: {
                    'sections.$.fields': fields,
                },
            },
            { new: true },
        );

        res.json({
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
        });
    }
};
