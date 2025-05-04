import { books_db } from '../db/queries/books.js';
import { friends_db } from '../db/queries/friends.js';
import { lends_db } from '../db/queries/lends.js';

export const getAllBooks = async (req, res, next) => {
    const books = await books_db.getBooks();
    res.books = books;

    next();
};

export const getOwnedBooks = async (req, res, next) => {
    const userId = req.cookies?.lend_me_usr;
    const books = await books_db.getBooksOwnedBy([userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.user = books;

    next();
};

export const getFriendsBooks = async (req, res, next) => {
    const userId = req.cookies?.lend_me_usr;
    const friends = await friends_db.getFriends(userId);
    const books = await books_db.getBooksOwnedBy(friends, [userId]);
    if (!res.books) {
        res.books = {};
    }
    res.books.friends = books;

    next();
};

export const getBorrowedBooks = async (req, res, next) => {
    const userId = req.cookies?.lend_me_usr;
    const borrowed_books = await lends_db.getBy('lends.to_id', userId);
    if (!res.books) {
        res.books = {};
    }
    res.books.borrowed = borrowed_books;
    console.log(borrowed_books);

    next();
};
