import { Router } from 'express';
import { getBookDetail, updateBookData } from '../controllers/books.js';
import {
    getAllAuthors,
    getAuthorData,
    updateAuthorData,
} from '../controllers/authors.js';
import { getAllCategories } from '../controllers/categories.js';
import {
    getAllEditorials,
    getEditorialData,
    updateEditorialData,
} from '../controllers/editorials.js';

const detailsRoute = Router();

// book
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

detailsRoute.post('/:bookId/book/edit', updateBookData, (req, res) => {
    const { bookId } = req.params;
    res.redirect(`/detail/${bookId}/book`);
});

// author
detailsRoute.get('/:authorId/author', getAuthorData, (req, res) => {
    const authorData = res.author;

    res.render('details/author.ejs', authorData);
});

detailsRoute.get('/:authorId/author/edit', getAuthorData, (req, res) => {
    const authorData = res.author;

    res.render('details/authorEdit.ejs', authorData);
});

detailsRoute.post('/:authorId/author/edit', updateAuthorData, (req, res) => {
    const { authorId } = req.params;
    res.redirect(`/detail/${authorId}/author`);
});

// editorial
detailsRoute.get('/:editorialId/editorial', getEditorialData, (req, res) => {
    const editorialData = res.editorial;

    res.render('details/editorial.ejs', editorialData);
});

detailsRoute.get(
    '/:editorialId/editorial/edit',
    getEditorialData,
    (req, res) => {
        const editorialData = res.editorial;

        res.render('details/editorialEdit.ejs', editorialData);
    },
);

detailsRoute.post(
    '/:editorialId/editorial/edit',
    updateEditorialData,
    (req, res) => {
        const { editorialId } = req.params;
        res.redirect(`/detail/${editorialId}/editorial`);
    },
);

export default detailsRoute;
