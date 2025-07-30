import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema({
    originalname: {
        type: String,
        require: true,
    },
    filename: {
        type: String,
        require: true,
    },

    path: {
        type: String,
        require: true,
        unique: true,
    },
    size: {
        type: Number,
        require: true,
    },
});

export default mongoose.model('Gallery', GallerySchema);
