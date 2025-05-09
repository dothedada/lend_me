import { Router } from 'express';
import { deleteRequest, requestBook } from '../controllers/lends.js';

const lendsRoute = Router();

lendsRoute.post('/request', requestBook, (req, res) => {
    res.redirect('/books');
});

lendsRoute.post('/cancel', deleteRequest, (req, res) => {
    res.redirect('/');
});

export default lendsRoute;
