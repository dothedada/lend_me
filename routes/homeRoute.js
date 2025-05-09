import { Router } from 'express';
import { getOwnedBooks } from '../controllers/books.js';
import { getUserTransactions } from '../controllers/lends.js';

const homeRoute = Router();

homeRoute.get('/', getUserTransactions, getOwnedBooks, async (req, res) => {
    const userData = req.user;

    const { requested, active, denied } = res.transactions;

    const [borrowed, lended] = active.reduce(
        (acc, book) => {
            const insertionInd = book.owner_user_id !== +userData.id ? 0 : 1;
            acc[insertionInd].push(book);
            return acc;
        },
        [[], []],
    );

    res.render('dashboard.ejs', {
        user: userData,
        requestsBooks: requested ?? [],
        deniedRequest: denied ?? [],
        borrowedBooks: borrowed,
        lendedBooks: lended,
        userBooks: res.books.user,
    });
});

export default homeRoute;
