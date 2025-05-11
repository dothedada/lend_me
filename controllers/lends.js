import { lends_db } from '../db/queries/lends.js';

export const getUserTransactions = async (req, res, next) => {
    const userId = req.user.id;
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
};

export const requestBook = async (req, res, next) => {
    const to_id = req.user.id;
    const { owner_id, book_id } = req.body;
    await lends_db.lend({ to_id, owner_id, book_id });

    next();
};

export const deleteRequest = async (req, res, next) => {
    const { lend_id } = req.body;
    await lends_db.deleteRequest(lend_id);

    next();
};

export const responseRequest = async (req, res, next) => {
    const { lend_id, action } = req.body;
    if (action === 'accept') {
        await lends_db.changeStatus(lend_id, 'active');
    } else if (action === 'deny') {
        await lends_db.changeStatus(lend_id, 'denied');
    }

    next();
};

export const returnBook = async (req, res, next) => {
    const { lend_id } = req.body;
    await lends_db.changeStatus(lend_id, 'returned');

    next();
};
