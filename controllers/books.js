import { getAllBooks_db } from '../db/queries_book.js';

export const getAllBooks = async (req, res, next) => {
    const books = await getAllBooks_db();
    res.books = books;

    next();
};
