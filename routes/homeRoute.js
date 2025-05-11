import { Router } from 'express';
import { getOwnedBooks } from '../controllers/books.js';
import { getUserTransactions } from '../controllers/lends.js';

const homeRoute = Router();

homeRoute.get('/', getUserTransactions, getOwnedBooks, async (req, res) => {
    const userData = req.user;
    const { requested, active, denied } = res.transactions;

    res.render('dashboard.ejs', {
        user: userData,
        requestsBooks: [...requested, ...denied],
        activeBooks: active,
        userBooks: res.books.user,
    });
});

export default homeRoute;
