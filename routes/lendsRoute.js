import { Router } from 'express';
import { requestBook } from '../controllers/lends.js';

const lendsRoute = Router();

lendsRoute.post('/request', requestBook, (req, res) => {
    res.redirect('/books');
});

export default lendsRoute;
