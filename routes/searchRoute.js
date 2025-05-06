import { Router } from 'express';
import { searchWithinFirends } from '../controllers/books.js';

const searchRoute = Router();

searchRoute.get('/', searchWithinFirends, (req, res) => {
    const search = req.query.q;
    const foundBooks = res.books;

    res.render('search.ejs', { search, foundBooks, h1: 'seses e' });
});

export default searchRoute;
