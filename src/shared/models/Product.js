import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
    {
        active: {
            type: Boolean,
        },
        isCatalog: {
            type: Boolean,
        },
        name: {
            type: Object,
            require: true,
        },
        slug: {
            type: Object,
            require: true,
        },
        description: {
            type: Object,
        },
        availability: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductAvailability',
            require: true,
        },
        sku: {
            type: String,
            require: true,
            unique: true,
        },
        part_number: {
            type: String,
            require: true,
        },
        category: {
            type: Array,
            require: true,
        },
        price: {
            type: Number,
            require: true,
        },
        parameters: {
            type: Object,
        },
        images: {
            type: Array,
        },
        keywords: {
            type: Array,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Product', ProductSchema);
