import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            require: true,
        },
        quantity: {
            type: Number,
            require: true,
            min: 1,
        },
    },
    {
        timestamps: true,
    },
);

export default CartItemSchema;
