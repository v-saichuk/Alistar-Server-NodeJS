import mongoose from 'mongoose';

const ReviewsSchema = new mongoose.Schema(
    {
        user: {
            firstName: {
                type: String,
                require: true,
            },
            lastName: {
                type: String,
                require: true,
            },
            email: {
                type: String,
                require: true,
            },
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
        // Посилання на батьківський відгук, якщо це відповідь на інший коментар
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reviews',
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Reviews', ReviewsSchema);
