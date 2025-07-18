import { body } from 'express-validator';

export const create = [
    body('title', 'The role name cannot be less than 2 characters or a number').isString().isLength({ min: 2 }),
    body('color', 'Minimum length of color name is 4 characters').isLength({ min: 4 }),
    body('is_setting', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('is_admin_panel', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('templates.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.duplicate', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('orders.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('orders.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('orders.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('orders.duplicate', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('orders.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('offer_owners.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offer_owners.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offer_owners.delete', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('offers.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offers.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offers.delete', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('users.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('users.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('users.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
];

export const update = [
    body('title', 'The role name cannot be less than 2 characters or a number').isString().isLength({ min: 2 }),
    body('color', 'Minimum length of color name is 4 characters').isLength({ min: 4 }),
    body('websites.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('websites.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('websites.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('websites.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('landings.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('landings.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('landings.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('landings.duplicate', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('landings.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('templates.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.duplicate', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('templates.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('legals.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('legals.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('legals.delete', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('legals.duplicate', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('legals.status', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('offer_owners.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offer_owners.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offer_owners.delete', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('offers.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offers.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('offers.delete', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('users.create', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('users.edit', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('users.delete', 'Specify only Boolean (Yes or No)').isBoolean(),

    body('is_setting', 'Specify only Boolean (Yes or No)').isBoolean(),
    body('is_admin_panel', 'Specify only Boolean (Yes or No)').isBoolean(),
];
