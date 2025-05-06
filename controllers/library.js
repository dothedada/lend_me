import { bookUser_db } from '../db/queries/library.js';

export const addToLibrary = async (req, res, next) => {
    const userData = req.user;
    const { bookId } = req.params;
    const reguster = bookUser_db.addBook(bookId, userData.id);

    next();
};
