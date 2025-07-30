import mongoose from 'mongoose';

const OrderStatusSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
        },
        color: {
            type: String,
            require: true,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('OrderStatus', OrderStatusSchema);
