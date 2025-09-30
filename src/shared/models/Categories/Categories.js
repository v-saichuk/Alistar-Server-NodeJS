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
});

export default mongoose.model('Category', CategorySchema);
