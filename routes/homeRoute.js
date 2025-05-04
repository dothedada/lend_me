import { Router } from 'express';
import {
    getBorrowedBooks,
    getLendedBooks,
    getOwnedBooks,
} from '../controllers/books.js';
import { users_db } from '../db/queries/simpleQuerys.js';

const homeRoute = Router();

homeRoute.get(
    '/',
    getLendedBooks,
    getBorrowedBooks,
    getOwnedBooks,
    async (req, res) => {
        const id = req.cookies.lend_me_usr;
        const userData = await users_db.get(id);

        res.render('dashboard.ejs', {
            user: userData.name,
            borrowedBooks: res.books.borrowed,
            lendedBooks: res.books.lended,
            userBooks: res.books.user,
        });
    },
);

export default homeRoute;
