import { Router } from 'express';
import {
    getAllBooks,
    getBookByTitle,
    getFriendsBooks,
    getOwnedBooks,
    pickRandomBooks,
    addNewBook,
    addBookValidation,
} from '../controllers/books.js';
import { getAllAuthors } from '../controllers/authors.js';
import { getAllEditorials } from '../controllers/editorials.js';
import { getAllCategories } from '../controllers/categories.js';
import { addToLibrary, removeFromLibrary } from '../controllers/library.js';

const fetchBookData = [getAllEditorials, getAllAuthors, getAllCategories];

const booksRoute = Router();

booksRoute.get(
    '/',
    getAllBooks,
    getOwnedBooks,
    getFriendsBooks,
    async (req, res) => {
        const userData = req.user;

        const friendsBooksShelf = pickRandomBooks(res.books.friends, 3);
        const titles = res.books.map((book) => book.title);

        res.render('books.ejs', {
            user: userData,
            h1: `${userData.name}'s & friends books`,
            friendsBooks: friendsBooksShelf,
            userBooks: res.books.user,
            titles,
        });
    },
);

booksRoute.post('/add', getBookByTitle, fetchBookData, (req, res) => {
    const title = req.body?.title || 'new book';
    const titleExist = res.book.length > 0;
    const booksData = res.book || [];
    const authors = res.authors.map((author) => author.name);
    const categories = res.categories.map((name) => name.category);
    const editorials = res.editorials.map((ed) => ed.name);
    res.render('details/bookAdd.ejs', {
        title,
        titleExist,
        booksData,
        authors,
        editorials,
        categories,
    });
});

booksRoute.post('/:bookId/add', addToLibrary, (req, res) => {
    res.redirect('/books');
});

booksRoute.post(
    '/new',
    addBookValidation,
    addNewBook,
    addToLibrary,
    fetchBookData,
    (req, res) => {
        if (res.errors !== undefined) {
            const authors = res.authors.map((author) => author.name);
            const categories = res.categories.map((name) => name.category);
            const editorials = res.editorials.map((ed) => ed.name);
            return res.render('details/bookAdd.ejs', {
                ...req.body,
                titleExist: false,
                booksData: [],
                authors,
                editorials,
                categories,
                errors: res.errors,
            });
        }
        res.redirect('/books');
    },
);

booksRoute.post('/:bookId/remove', removeFromLibrary, (req, res) => {
    res.redirect('/books');
});

export default booksRoute;
