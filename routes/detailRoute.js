import { Router } from 'express';
import { getBookDetail } from '../controllers/books.js';
import { getAllAuthors } from '../controllers/authors.js';
import { getAllCategories } from '../controllers/categories.js';
import { getAllEditorials } from '../controllers/editorials.js';

const detailsRoute = Router();

detailsRoute.get('/:bookId/book', getBookDetail, (req, res) => {
    const bookData = res.book;
    res.render('details/book.ejs', { ...bookData });
});

detailsRoute.get(
    '/:bookId/book/edit',
    getBookDetail,
    getAllAuthors,
    getAllCategories,
    getAllEditorials,
    (req, res) => {
        const bookData = res.book;
        const authors = res.authors;
        const categories = res.categories;
        const editorials = res.editorials;
        res.render('details/bookEdit.ejs', {
            ...bookData,
            authors,
            editorials,
            categories,
        });
    },
);

export default detailsRoute;
