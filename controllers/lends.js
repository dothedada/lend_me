import { lends_db } from '../db/queries/lends.js';
import { asyncWrapper } from './middleware.js';
import { CustomErr, errorMsg } from './validations.js';

export const getUserTransactions = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const transactions = await lends_db.getTransactions(userId);
    const transactionStatus = {
        requested: [],
        denied: [],
        active: [],
        returned: [],
    };

    transactions.reduce((acc, transaction) => {
        if (!acc[transaction.status]) {
            acc[transaction.status] = [];
        }
        acc[transaction.status].push(transaction);
        return acc;
    }, transactionStatus);

    transactionStatus.denied = transactionStatus.denied.filter(
        (book) => book.to_user_id === +userId,
    );

    res.transactions = transactionStatus;

    next();
});

export const requestBook = async (req, _, next) => {
    const to_id = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const { owner_id, book_id } = req.body;
    if (!owner_id || !book_id) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await lends_db.lend({ to_id, owner_id, book_id });

    next();
};

export const deleteRequest = async (req, _, next) => {
    const { lend_id } = req.body;
    if (!lend_id) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await lends_db.deleteRequest(lend_id);

    next();
};

export const responseRequest = async (req, _, next) => {
    const { lend_id, action } = req.body;
    if (!lend_id || !action) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    if (action === 'accept') {
        await lends_db.changeStatus(lend_id, 'active');
    } else if (action === 'deny') {
        await lends_db.changeStatus(lend_id, 'denied');
    }

    next();
};

export const returnBook = async (req, _, next) => {
    const { lend_id } = req.body;
    if (!lend_id) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await lends_db.changeStatus(lend_id, 'returned');

    next();
};
