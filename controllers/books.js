import { books_db } from '../db/queries/books.js';
import { friends_db } from '../db/queries/friends.js';
import { lends_db } from '../db/queries/lends.js';

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

export const getBorrowedBooks = async (req, res, next) => {
    const userId = req.user.id;
    const borrowed_books = await lends_db.getBy('lends.to_id', userId);
    if (!res.books) {
        res.books = {};
    }

    res.books.borrowed = borrowed_books.filter(
        (book) => book.status !== 'returned',
    );

    next();
};

export const getLendedBooks = async (req, res, next) => {
    const userId = req.user.id;
    const lended_books = await lends_db.getBy('lends.from_id', userId);
    if (!res.books) {
        res.books = {};
    }

    res.books.lended = lended_books.filter(
        (book) => book.status !== 'returned',
    );

    next();
};

export const updateBookData = async (req, res, next) => {
    const valuesToUpdate = req.body;

    const updatedBook = await books_db.put(valuesToUpdate);
    res.book = updatedBook;

    next();
};

export const searchWithinFirends = async (req, res, next) => {
    const userId = req.user.id;
    const lookFor = req.query.q;
    const friends = await friends_db.getFriends(userId);

    const booksFound = await books_db.search(lookFor, friends, userId);
    if (!res.books) {
        res.books = {};
    }

    res.books = booksFound;

    next();
};

export const getBookByTitle = async (req, res, next) => {
    const { title } = req.body;
    const books = await books_db.getBy('title', title);

    res.book = books.length > 0 ? books : false;

    next();
};

export const addNewBook = async (req, res, next) => {
    const bookData = req.body;
    const book = await books_db.add(bookData);
    res.book = book;

    next();
};
