import mongoose from 'mongoose';

const SettingsEmailSchema = new mongoose.Schema({
    host: {
        type: String,
        require: true,
    },
    port: {
        type: Number,
        require: true,
    },
    secure: {
        type: Boolean,
        require: true,
    },
    auth: {
        no_reply: {
            user: {
                type: String,
                require: true,
            },
            pass: {
                type: String,
                require: true,
            },
        },
        order: {
            user: {
                type: String,
                require: true,
            },
            pass: {
                type: String,
                require: true,
            },
        },
    },
});

export default mongoose.model('SettingsEmail', SettingsEmailSchema);
