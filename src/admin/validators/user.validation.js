import { body } from 'express-validator';

export const create = [
    body('avatar', 'Аватар не является посиланням').optional(),
    body('firstName', 'Занад-то коротке імя користувача').isLength({ min: 2 }),
    body('lastName', 'Занад-то коротка фамілія користувача').isLength({ min: 2 }),
    body('email', 'Email не валідний').isEmail(),
];

export const update = [
    body('avatar', 'Аватар не является посиланням').optional(),
    body('firstName', 'Занад-то коротке імя користувача').isLength({ min: 2 }),
    body('lastName', 'Занад-то коротка фамілія користувача').isLength({ min: 2 }),
    body('email', 'Email не валідний').isEmail(),
];
