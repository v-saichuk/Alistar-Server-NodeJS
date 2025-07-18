import mongoose from 'mongoose';

const RedirectSchema = new mongoose.Schema(
    {
        from: { type: String, required: true, unique: true },
        to: { type: String, required: true },
        type: { type: Number, default: 301 },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', unique: true },
    },
    { timestamps: true },
);

export default mongoose.model('Redirect', RedirectSchema);
