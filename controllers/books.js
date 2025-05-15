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

export const getAllBooks = asyncWrapper(async (req, res, next) => {
    const books = await books_db.getBooks();
    if (books.lenght === 0) {
        throw new CustomErr(errorMsg.books.noItems, 404, 'noItemsData');
    }

    res.books = books;

    next();
});

export const getBookDetail = asyncWrapper(async (req, res, next) => {
    const { bookId } = req.params;
    if (!bookId) {
        throw new CustomErr(errorMsg.books.noIdParam, 404, 'noItemsData');
    }

    const book = await books_db.getBooks(bookId);
    if (!book) {
        throw new CustomErr(errorMsg.books.notFound, 404, 'itemNotFound');
    }

    res.book = book;

    next();
});

export const getOwnedBooks = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.noUserIdParam, 404, 'userIdNotFound');
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
        throw new CustomErr(errorMsg.noUserIdParam, 404, 'userIdNotFound');
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
    const updatedBook = await books_db.put(valuesToUpdate);

    if (!updatedBook) {
        throw new CustomErr(errorMsg.books.update, 500, 'updateUnsuccesfull');
    }

    res.book = updatedBook;

    next();
});

export const searchWithinFirends = asyncWrapper(async (req, res, next) => {
    if (res.errors) {
        return next();
    }

    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.noUserIdParam, 404, 'userIdNotFound');
    }

    const lookFor = req.query.q;
    const friends = await friends_db.getFriends(userId);
    const booksFound = await books_db.search(lookFor, friends, userId);
    res.books = booksFound;

    next();
});

export const getBookByTitle = asyncWrapper(async (req, res, next) => {
    const { title } = req.body;
    let books = [];
    if (title !== '') {
        books = await books_db.getBy('title', title);
    }

    res.book = books;

    next();
});

export const addNewBook = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined || res.cleanData === undefined) {
        return next();
    }
    const bookData = res.cleanData;
    const book = await books_db.add(bookData);

    if (!book) {
        throw new CustomErr(errorMsg.books.add, 500, 'cannotWriteNewBook');
    }

    res.book = book;

    next();
});
