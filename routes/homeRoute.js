import { Router } from 'express';
import { getAllBooks } from '../controllers/books.js';

const homeRoute = Router();

homeRoute.get('/', getAllBooks, (req, res) => {
    res.render('dashboard.ejs', { user: 'test', books: res.books });
});

export default homeRoute;
