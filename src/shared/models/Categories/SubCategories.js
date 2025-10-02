import mongoose from 'mongoose';

const SubCategorySchema = new mongoose.Schema({
    name: {
        type: Object,
        require: true,
    },
    slug: {
        type: Object,
        require: true,
    },
    icon: {
        type: String,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
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

export default mongoose.model('Subcategory', SubCategorySchema);
