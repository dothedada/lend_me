import { Router } from 'express';
import { getAllBooks } from '../controllers/books.js';

const homeRoute = Router();

homeRoute.get('/', getAllBooks, (req, res) => {
    console.log(res.books);
    res.send('holi desde el router');
});

export default homeRoute;
