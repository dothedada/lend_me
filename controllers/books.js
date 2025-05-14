import { books_db } from '../db/queries/books.js';
import { friends_db } from '../db/queries/friends.js';
import { setValidationResult } from './middleware.js';
import { searchInputRules, bookRules } from './errors.js';

export const searchInputValidation = [searchInputRules, setValidationResult];
export const addBookValidation = [bookRules, setValidationResult];

export const getAllBooks = async (req, res, next) => {
    const books = await books_db.getBooks();
    res.books = books;

    next();
};

export const getBookDetail = async (req, res, next) => {
    const { bookId } = req.params;
    const book = await books_db.getBooks(bookId);
    res.book = book;

    next();
};

export const getOwnedBooks = async (req, res, next) => {
    const userId = req.user.id;
    const books = await books_db.getBooksOwnedBy([userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.user = books;

    next();
};

export const getFriendsBooks = async (req, res, next) => {
    const userId = req.user.id;
    const friends = await friends_db.getFriends(userId);
    const books = await books_db.getBooksOwnedBy(friends, [userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.friends = books;

    next();
};

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

export const updateBookData = async (req, res, next) => {
    if (res.errors) {
        return next();
    }

    const valuesToUpdate = req.body;
    const updatedBook = await books_db.put(valuesToUpdate);
    res.book = updatedBook;

    next();
};

export const searchWithinFirends = async (req, res, next) => {
    if (res.errors) {
        return next();
    }

    const userId = req.user.id;
    const lookFor = req.query.q;
    const friends = await friends_db.getFriends(userId);
    const booksFound = await books_db.search(lookFor, friends, userId);
    res.books = booksFound;

    next();
};

export const getBookByTitle = async (req, res, next) => {
    const { title } = req.body;
    let books = [];
    if (title !== '') {
        books = await books_db.getBy('title', title);
    }

    res.book = books.length > 0 ? books : false;

    next();
};

export const addNewBook = async (req, res, next) => {
    if (res.errors !== undefined || res.cleanData === undefined) {
        return next();
    }
    const bookData = res.cleanData;
    const book = await books_db.add(bookData);
    res.book = book;

    next();
};
