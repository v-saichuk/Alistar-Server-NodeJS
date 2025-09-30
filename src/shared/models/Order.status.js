import mongoose from 'mongoose';

const OrderStatusSchema = new mongoose.Schema(
    {
        title: {
            type: Object,
            require: true,
        },
        color: {
            type: String,
            require: true,
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('OrderStatus', OrderStatusSchema);
