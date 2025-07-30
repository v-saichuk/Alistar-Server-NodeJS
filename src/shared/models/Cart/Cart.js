import mongoose from 'mongoose';
import CartItemSchema from './CartItem.js';

const CartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true,
        },
        items: [CartItemSchema],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Cart', CartSchema);
