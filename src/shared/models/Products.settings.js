import mongoose, { Types } from 'mongoose';

const ProductsSettingsSchema = new mongoose.Schema(
    {
        categories: [
            {
                name: {
                    type: Object,
                },
                content: [
                    {
                        name: {
                            type: Object,
                        },
                        content: [
                            {
                                title: Object,
                            },
                        ],
                    },
                ],
            },
        ],
        status: [
            {
                title: {
                    type: Object,
                    require: true,
                },
                color: {
                    type: String,
                    require: true,
                },
            },
        ],
        currency: {
            title: {
                type: String,
            },
            course: {
                type: Number,
            },
            autoCourse: {
                type: Boolean,
            },
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('ProductsSettings', ProductsSettingsSchema);
