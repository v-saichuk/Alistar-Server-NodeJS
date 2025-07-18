import mongoose, { Types } from 'mongoose';

const TemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
        },
        sections: [
            {
                _id: Types.ObjectId,
                title: String,
                status: Boolean,
                fields: [
                    {
                        _id: Types.ObjectId,
                        field_type: {
                            type: String,
                            require: true,
                        },
                        field_name: {
                            type: String,
                            require: true,
                        },
                        content: {
                            type: Object,
                            require: true,
                        },
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Template', TemplateSchema);
