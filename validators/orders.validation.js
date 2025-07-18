import { body } from 'express-validator';

export const create = [
    body('fullName', "Ім'я користувача не може бути меньш ніж 1 символ!").isString().isLength({ min: 1 }),
    body('phone', "Телефон користувача є обов'язковим!").isString(),
    body('status', 'Статус обовязковий для заповнення!').isString().isLength({ min: 1 }),
];
export const update = [
    body('fullName', "Ім'я користувача не може бути меньш ніж 1 символ!").isString().isLength({ min: 1 }),
    body('phone', "Телефон користувача є обов'язковим!").isString(),
    body('status', 'Статус обовязковий для заповнення!').isString().isLength({ min: 1 }),
];
