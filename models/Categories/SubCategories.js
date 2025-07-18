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
});

export default mongoose.model('Subcategory', SubCategorySchema);
