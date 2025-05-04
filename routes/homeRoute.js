import { Router } from 'express';
import {
    getBorrowedBooks,
    getLendedBooks,
    getOwnedBooks,
} from '../controllers/books.js';

const homeRoute = Router();

homeRoute.get(
    '/',
    getLendedBooks,
    getBorrowedBooks,
    getOwnedBooks,
    async (req, res) => {
        const userData = req.user;

        res.render('dashboard.ejs', {
            user: userData.name,
            borrowedBooks: res.books.borrowed,
            lendedBooks: res.books.lended,
            userBooks: res.books.user,
        });
    },
);

export default homeRoute;
