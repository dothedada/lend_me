import { lends_db } from '../db/queries/lends.js';

export const getUserTransactions = async (req, res, next) => {
    const userId = req.user.id;
    const userTransactions = await lends_db.getTransactions(userId);

    res.transactions = userTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.status]) {
            acc[transaction.status] = [];
        }
        acc[transaction.status].push(transaction);
        return acc;
    }, {});

    next();
};

export const requestBook = async (req, res, next) => {
    const to_id = req.user.id;
    const { owner_id, book_id } = req.body;

    console.log(to_id, owner_id, book_id);

    lends_db.lend({ to_id, owner_id, book_id });

    next();
};
