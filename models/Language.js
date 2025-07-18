import mongoose from 'mongoose';

const LanguageSchema = new mongoose.Schema({
    position: {
        type: Number,
        require: true,
        unique: true,
    },
    title: {
        type: String,
        require: true,
    },
    code: {
        type: String,
        require: true,
        unique: true,
    },
    currency: {
        type: String,
        require: true,
    },
    currencySymbol: {
        type: String,
        require: true,
    },
    urlCode: {
        type: String,
        require: true,
        unique: true,
    },
    htmlCode: {
        type: String,
        require: true,
        unique: true,
    },
    status: {
        type: Boolean,
        require: true,
    },
});

export default mongoose.model('Language', LanguageSchema);
