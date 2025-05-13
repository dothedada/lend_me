import { Router } from 'express';
import {
    searchWithinFirends,
    searchInputValidation,
} from '../controllers/books.js';

const searchRoute = Router();

searchRoute.get('/', searchInputValidation, searchWithinFirends, (req, res) => {
    const search = req.query.q;
    const foundBooks = res.books ?? [];

    res.render('search.ejs', {
        search,
        foundBooks,
        h1: 'search results in your circle',
        errors: res.errors,
    });
});

export default searchRoute;
