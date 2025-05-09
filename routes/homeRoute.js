import { Router } from 'express';
import { getOwnedBooks, getUserTransactions } from '../controllers/books.js';

const homeRoute = Router();

homeRoute.get('/', getUserTransactions, getOwnedBooks, async (req, res) => {
    const userData = req.user;

    res.render('dashboard.ejs', {
        user: userData.name,
        requestsBooks: res.transactions.requests,
        borrowedBooks: res.transactions.active.filter(
            (lend) => lend.from_id !== userData.id,
        ),
        lendedBooks: res.transactions.active.filter(
            (lend) => lend.from_id === userData.id,
        ),
        userBooks: res.books.user,
    });
});

export default homeRoute;
