import { body, query } from 'express-validator';

export const errorMsg = {
    length: (min, max) => `must be between ${min} and ${max} characters`,
    empty: 'cannot be empty',
    emailTaken: 'this mail already corresponds to anothe user',
    email: 'Must be a valid email, user@domain.xyz',
    numeric: 'must be a number',
    onlyLetters: 'must contain only letters',
    url: 'must be a valid URL',
};

export const loginRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(`Name ${errorMsg.empty}.`)
        .isLength({ min: 4, max: 20 })
        .withMessage(`Name ${errorMsg.length(4, 20)}`),
    body('email')
        .trim()
        .notEmpty()
        .withMessage(`Email ${errorMsg.empty}.`)
        .isEmail()
        .withMessage(errorMsg.email),
    body('keepLogged'),
];

export const searchInputRules = [
    query('q')
        .isLength({ min: 4 })
        .withMessage('Search param must be at least 4 characters'),
];

export const bookRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage(`Title ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Title ${errorMsg.length(1, 120)}`)
        .escape(),
    body('author')
        .trim()
        .notEmpty()
        .withMessage(`Author ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Author ${errorMsg.length(1, 120)}`)
        .escape(),
    body('year')
        .trim()
        .notEmpty()
        .withMessage(`Year ${errorMsg.empty}`)
        .isNumeric()
        .withMessage(`Year ${errorMsg.numeric}`)
        .escape(),
    body('category')
        .trim()
        .notEmpty()
        .withMessage(`Category ${errorMsg.empty}`)
        .isAlpha('es-ES')
        .withMessage(`Category ${errorMsg.onlyLetters}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Category ${errorMsg.length(1, 120)}`)
        .escape(),
    body('editorial')
        .trim()
        .notEmpty()
        .withMessage(`Editorial ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Editorial ${errorMsg.length(1, 120)}`)
        .escape(),
    body('sinopsys')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage(`Sinopsys ${errorMsg.length(1, 1000)}`)
        .escape(),
    body('image')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage(`Image ${errorMsg.url}`),
    body('url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage(`Url ${errorMsg.url}`),
];

export const authorRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(`Title ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Title ${errorMsg.length(1, 120)}`)
        .escape(),
    body('bio')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage(`Bio ${errorMsg.length(1, 1000)}`)
        .escape(),
    body('url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage(`Url ${errorMsg.url}`),
];

export const editorialRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(`Name ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Name ${errorMsg.length(1, 120)}`)
        .escape(),
    body('url')
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage(`Url ${errorMsg.url}`),
];

export const friendRequestRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(`Name ${errorMsg.empty}`)
        .isLength({ min: 1, max: 120 })
        .withMessage(`Name ${errorMsg.length(1, 120)}`)
        .escape(),
    body('email')
        .trim()
        .notEmpty()
        .withMessage(`Email ${errorMsg.empty}.`)
        .isEmail()
        .withMessage(errorMsg.email),
    body('message')
        .trim()
        .notEmpty()
        .withMessage(`Email ${errorMsg.empty}.`)
        .isLength({ min: 120, max: 500 })
        .withMessage(`Name ${errorMsg.length(120, 500)}`)
        .escape(),
];
