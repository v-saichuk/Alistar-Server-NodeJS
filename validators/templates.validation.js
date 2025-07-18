import { body } from 'express-validator';

export const create = [body('name', 'Імя не може бути меньш ніж 1 символи').isString().isLength({ min: 1 })];
export const update = [body('name', 'Імя не може бути меньш ніж 1 символи').isString().isLength({ min: 1 })];
