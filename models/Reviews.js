import mongoose from 'mongoose';

const ReviewsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            require: true,
        },
        comment: {
            type: String,
            require: true,
        },
        rate: {
            type: Number,
            default: 0,
        },
        like: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Reviews', ReviewsSchema);
