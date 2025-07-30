import mongoose, { Types } from 'mongoose';

const OrdersSettingsSchema = new mongoose.Schema(
    {
        status: [
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
        ],
        statusPayments: [
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
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('OrdersSettings', OrdersSettingsSchema);
