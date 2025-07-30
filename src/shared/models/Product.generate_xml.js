import mongoose from 'mongoose';

const ProductGenerateXmlSchema = new mongoose.Schema(
    {
        selects: {
            type: Array,
        },
        filters: {
            type: Object,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('ProductGenerateXml', ProductGenerateXmlSchema);
