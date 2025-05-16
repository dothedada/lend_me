import { bookUser_db } from '../db/queries/library.js';
import { asyncWrapper } from './middleware.js';
import { CustomErr, errorMsg } from './validations.js';

export const addToLibrary = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const userData = req.user;
    if (!userData) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserData');
    }

    const bookId = req.params.bookId ?? res.book.id;
    if (!bookId) {
        throw new CustomErr(errorMsg.library.noData, 404, 'missingUserData');
    }

    await bookUser_db.addBook(String(bookId), userData.id);

    next();
});

export const removeFromLibrary = asyncWrapper(async (req, _, next) => {
    const userData = req.user;
    if (!userData) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserData');
    }

    const { bookId } = req.params;
    if (!bookId) {
        throw new CustomErr(errorMsg.library.noData, 404, 'missingUserData');
    }

    await bookUser_db.removeBook(bookId, userData.id);

    next();
});
