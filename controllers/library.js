import { bookUser_db } from '../db/queries/library.js';

export const addToLibrary = async (req, res, next) => {
    const userData = req.user;
    const bookId = req.params.bookId ?? res.book.id;

    if (!bookId) {
        throw new Error('No book data to add into the library');
    }

    const register = bookUser_db.addBook(String(bookId), userData.id);

    if (!register) {
        console.log('ya existe');
    }

    next();
};

export const removeFromLibrary = async (req, res, next) => {
    const userData = req.user;
    const { bookId } = req.params;
    const register = bookUser_db.removeBook(bookId, userData.id);

    if (!register) {
        console.log('no existe');
    }

    next();
};
