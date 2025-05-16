import { body, query } from 'express-validator';
import { recordExists } from '../db/utils.js';
import { friends_db } from '../db/queries/friends.js';

export const errorMsg = {
    // Validation
    length: (min, max) => `must be between ${min} and ${max} characters`,
    empty: 'cannot be empty',
    emailTaken: 'this mail already corresponds to anothe user',
    email: 'Must be a valid email, user@domain.xyz',
    numeric: 'must be a number',
    onlyLetters: 'must contain only letters',
    url: 'must be a valid URL',
    noUser: (name, email) =>
        `No user called '${name}' with mail '${email}' was found`,
    areFriends: (name) => `You already are friend with '${name}'`,

    // db && middleware
    missingParams: 'Some request params are missing',
    missingBody: 'Some body request elements are missing',
    dbQuery: (table, err) =>
        `Database query to '${table}' failed: ${err.message}`,
    dbParams: (parameter) => `Invalid query parameter '${parameter}'`,
    dbMissingParams: 'missing needed params to run the query',
    dbUserNotExist: (user) => `The user with the id '${user}' does not exist`,

    books: {
        noIdParam: 'There is no bookId on the params',
        notFound: 'There is no book with the given id',
        update: 'An unknown error happen when updating re book register',
        add: 'An unknown error happen when adding the book register',
        noItems: 'No books where found',
    },
    authors: {
        noIdParam: 'There is no authorId on the params',
        notFound: 'There is no author with the given id',
        noItems: 'No authors where found',
        update: "An error occur while updating author's data",
    },
    categories: {
        noItems: 'No categories where found',
    },
    editorials: {
        noItems: 'No editorials where found',
        noIdParam: 'There is no editorialId on the params',
        notFound: 'There is no editorial with the given id',
        update: "An error occur while updating editorial's data",
    },
    library: {
        noData: 'No book data to add to the library',
    },
};

export class CustomErr extends Error {
    constructor(message, errorCode, name = '') {
        super(message);
        this.statusCode = errorCode;
        this.name = name;
    }
}

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
        .bail()
        .escape(),
    body('email')
        .trim()
        .notEmpty()
        .withMessage(`Email ${errorMsg.empty}.`)
        .isEmail()
        .withMessage(errorMsg.email)
        .bail(),
    body('message')
        .trim()
        .notEmpty()
        .withMessage(`Message ${errorMsg.empty}.`)
        .isLength({ min: 60, max: 500 })
        .withMessage(`Message ${errorMsg.length(60, 500)}`)
        .escape(),
    body('form')
        .custom(async (_, { req }) => {
            const { name, email } = req.body;
            const user = await recordExists('users', { name, email });
            if (!user) {
                throw new Error(errorMsg.noUser(name, email));
            }
            return true;
        })
        .custom(async (_, { req }) => {
            const { userId, name, email } = req.body;
            const friend = await recordExists('users', { name, email });

            if (!friend) {
                return true;
            }

            if (await friends_db.friendship(userId, friend.id)) {
                throw new Error(errorMsg.areFriends(name));
            }
            return true;
        }),
];
