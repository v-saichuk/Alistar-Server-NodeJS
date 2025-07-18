import mongoose from 'mongoose';

const ProductAvailabilitySchema = new mongoose.Schema(
    {
        title: {
            type: Object,
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

export default mongoose.model('ProductAvailability', ProductAvailabilitySchema);
