import { Router } from 'express';
import { getAllBooks } from '../controllers/books.js';
import { users_db } from '../db/queries/simpleQuerys.js';

const homeRoute = Router();

homeRoute.get('/', getAllBooks, async (req, res) => {
    const id = req.cookies.lend_me_usr;
    const userData = await users_db.get(id);
    res.render('dashboard.ejs', { user: userData.name, books: res.books });
});

export default homeRoute;
