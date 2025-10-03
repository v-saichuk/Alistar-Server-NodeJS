import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
    {
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
        active: {
            type: Boolean,
        },
        isCatalog: {
            type: Boolean,
        },
        isGoogleMerchant: {
            type: Boolean,
        },
        // Якщо false — ціну не оновлюємо автоматично
        isEditPrice: {
            type: Boolean,
            default: true,
        },
        // Джерело парсингу ціни (наприклад: 'fibermall')
        isParserSite: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Product', ProductSchema);
