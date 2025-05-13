import { bookUser_db } from '../db/queries/library.js';

export const addToLibrary = async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const userData = req.user;
    const bookId = req.params.bookId ?? res.book.id;

    if (!bookId) {
        throw new Error('No book data to add into the library');
    }

    await bookUser_db.addBook(String(bookId), userData.id);

    next();
};

export const removeFromLibrary = async (req, res, next) => {
    const userData = req.user;
    const { bookId } = req.params;

    await bookUser_db.removeBook(bookId, userData.id);

    next();
};
