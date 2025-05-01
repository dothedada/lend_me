import { books_db } from '../db/queries/books.js';

export const getAllBooks = async (req, res, next) => {
    const books = await books_db.getBooks();
    res.books = books;

    next();
};
