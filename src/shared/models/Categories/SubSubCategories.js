import mongoose from 'mongoose';

const SubSubCategorySchema = new mongoose.Schema({
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
        ref: 'Subcategory',
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

export default mongoose.model('Subsubcategory', SubSubCategorySchema);
