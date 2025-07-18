import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        ip: String,
        avatar: String,
        firstName: {
            type: String,
            require: true,
        },
        lastName: {
            type: String,
            require: true,
        },
        email: {
            type: String,
            require: true,
            unique: true,
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            require: true,
        },
        passwordHash: {
            type: String,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        language: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Language',
        },
        address: {
            isBilling: {
                type: Boolean,
                default: false,
            },
            shipping: {
                companyName: {
                    type: String,
                    default: '',
                },
                vatId: {
                    type: String,
                    default: '',
                },
                contactName: {
                    type: String,
                    default: '',
                },
                country: {
                    code: String,
                    id: Number,
                    label: String,
                    phone_code: String,
                    value: String,
                },
                state: {
                    id: Number,
                    label: String,
                    value: String,
                },
                city: {
                    type: String,
                    default: '',
                },
                street: {
                    type: String,
                    default: '',
                },
                phone: {
                    type: String,
                    default: '',
                },
                postCode: {
                    type: String,
                    default: '',
                },
            },
            billing: {
                companyName: {
                    type: String,
                    default: '',
                },
                contactName: {
                    type: String,
                    default: '',
                },
                country: {
                    code: String,
                    id: Number,
                    label: String,
                    phone_code: String,
                    value: String,
                },
                state: {
                    id: Number,
                    label: String,
                    value: String,
                },
                city: {
                    type: String,
                    default: '',
                },
                street: {
                    type: String,
                    default: '',
                },
                phone: {
                    type: String,
                    default: '',
                },
                postCode: {
                    type: String,
                    default: '',
                },
            },
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('User', UserSchema);
