import { body } from 'express-validator';

export const login = [
    body('email', 'Error. Invalid Email!').isEmail(),
    body('password', 'Error. The minimum password length is 5 characters!').isLength({ min: 5 }),
];
export const forgotPassword = [body('email', 'Error. Invalid Email!').isEmail()];
