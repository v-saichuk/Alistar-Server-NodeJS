import { body } from 'express-validator';

export const create = [
    body('title', 'Назва повина бути унікальною!').isString(),
    body('code', 'Код країни повинен бути унікальним!').isString(),
    body('currency', 'Валюта повина бути строчкою!').isString(),
    body('status', 'Статус має значення тільку True або False').isBoolean(),
];

// export const update = [body('status', 'Статус має значення тільку True або False').isBoolean()];
export const remove = [body('_id', 'Відсутній ID мови!').isString()];
