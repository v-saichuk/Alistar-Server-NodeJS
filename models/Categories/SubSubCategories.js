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
});

export default mongoose.model('Subsubcategory', SubSubCategorySchema);
