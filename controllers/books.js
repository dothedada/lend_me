import { books_db } from '../db/queries/books.js';
import { friends_db } from '../db/queries/friends.js';
import { setValidationResult } from './middleware.js';
import {
    searchInputRules,
    bookRules,
    errorMsg,
    CustomErr,
} from './validations.js';

export const searchInputValidation = [searchInputRules, setValidationResult];
export const addBookValidation = [bookRules, setValidationResult];

export const getAllBooks = asyncWrapper(async (_, res, next) => {
    const books = await books_db.getBooks();
    res.books = books;

    next();
});

export const getBookDetail = asyncWrapper(async (req, res, next) => {
    const { bookId } = req.params;
    if (!bookId) {
        throw new CustomErr(
            errorMsg.books.noIdParam,
            404,
            'missingRequestParam',
        );
    }

    const book = await books_db.getBooks(bookId);
    res.book = book;

    next();
});

export const getOwnedBooks = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const books = await books_db.getBooksOwnedBy([userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.user = books;

    next();
});

export const getFriendsBooks = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const friends = await friends_db.getFriends(userId);
    const books = await books_db.getBooksOwnedBy(friends, [userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.friends = books;

    next();
});

export const pickRandomBooks = (books, amount) => {
    let clearAmount = Math.min(books.length, amount);
    const availableBooks = [...books];
    const picks = [];

    while (clearAmount > 0) {
        const i = Math.floor(Math.random() * availableBooks.length);
        picks.push(...availableBooks.splice(i, 1));
        clearAmount--;
    }

    return picks;
};

export const updateBookData = asyncWrapper(async (req, res, next) => {
    if (res.errors) {
        return next();
    }

    const valuesToUpdate = req.body;
    if (!valuesToUpdate) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    const updatedBook = await books_db.put(valuesToUpdate);
    res.book = updatedBook;

    next();
});

export const searchWithinFirends = asyncWrapper(async (req, res, next) => {
    if (res.errors) {
        return next();
    }

    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const lookFor = req.query.q;
    const friends = await friends_db.getFriends(userId);
    const booksFound = await books_db.search(lookFor, friends, userId);
    res.books = booksFound;

    next();
});

export const getBookByTitle = asyncWrapper(async (req, res, next) => {
    const { title } = req.body;
    if (!title) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    let books = [];
    if (title !== '') {
        books = await books_db.getBy('title', title);
    }
    res.book = books;

    next();
});

export const addNewBook = asyncWrapper(async (_, res, next) => {
    if (res.errors !== undefined || res.cleanData === undefined) {
        return next();
    }
    const bookData = res.cleanData;
    const book = await books_db.add(bookData);
    res.book = book;

    next();
});
