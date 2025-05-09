import { Router } from 'express';
import { getOwnedBooks } from '../controllers/books.js';
import { getUserTransactions } from '../controllers/lends.js';

const homeRoute = Router();

homeRoute.get('/', getUserTransactions, getOwnedBooks, async (req, res) => {
    const userData = req.user;

    const { requested, active, denied } = res.transactions;
    res.render('dashboard.ejs', {
        user: userData,
        requestsBooks: requested ?? [],
        deniedRequest: denied ?? [],
        borrowedBooks: !active
            ? []
            : active.filter((lend) => lend.from_id !== userData.id),
        lendedBooks: !active
            ? []
            : active.filter((lend) => lend.from_id === userData.id),
        userBooks: res.books.user,
    });
});

export default homeRoute;
