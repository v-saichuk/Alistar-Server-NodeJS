import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
        },
        color: {
            type: String,
            require: true,
        },
        is_setting: {
            type: Boolean,
            default: false,
        },

        is_admin_panel: {
            type: Boolean,
            default: false,
        },

        orders: {
            create: {
                type: Boolean,
                default: false,
            },
            edit: {
                type: Boolean,
                default: false,
            },
            delete: {
                type: Boolean,
                default: false,
            },
            duplicate: {
                type: Boolean,
                default: false,
            },
        },

        products: {
            create: {
                type: Boolean,
                default: false,
            },
            edit: {
                type: Boolean,
                default: false,
            },
            delete: {
                type: Boolean,
                default: false,
            },
            duplicate: {
                type: Boolean,
                default: false,
            },
        },

        templates: {
            create: {
                type: Boolean,
                default: false,
            },
            edit: {
                type: Boolean,
                default: false,
            },
            delete: {
                type: Boolean,
                default: false,
            },
            duplicate: {
                type: Boolean,
                default: false,
            },
        },

        users: {
            create: {
                type: Boolean,
                default: false,
            },
            edit: {
                type: Boolean,
                default: false,
            },
            delete: {
                type: Boolean,
                default: false,
            },
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Role', RoleSchema);
