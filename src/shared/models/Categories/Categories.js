import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: Object,
        required: true,
    },
    slug: {
        type: Object,
        required: true,
        default: {},
    },
    icon: {
        type: String,
    },
    visible: {
        type: Boolean,
        default: true,
    },
    meta: {
        title: {
            type: Object,
            default: {},
        },
        description: {
            type: Object,
            default: {},
        },
        keywords: {
            type: Object,
            default: {},
        },
    },
});

export default mongoose.model('Category', CategorySchema);
