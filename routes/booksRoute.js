import { Router } from 'express';
import {
    getAllBooks,
    getBookByTitle,
    getFriendsBooks,
    getOwnedBooks,
    pickRandomBooks,
    addNewBook,
} from '../controllers/books.js';
import { getAllAuthors } from '../controllers/authors.js';
import { getAllEditorials } from '../controllers/editorials.js';
import { getAllCategories } from '../controllers/categories.js';
import { addToLibrary, removeFromLibrary } from '../controllers/library.js';

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

booksRoute.post(
    '/add',
    getBookByTitle,
    getAllEditorials,
    getAllAuthors,
    getAllCategories,
    (req, res) => {
        const { title } = req.body;
        const titleExist = res.book !== false;
        const booksData = res.book || [];
        const authors = res.authors;
        const categories = res.categories;
        const editorials = res.editorials;
        res.render('details/bookAdd.ejs', {
            title,
            titleExist,
            booksData,
            authors,
            editorials,
            categories,
        });
    },
);

booksRoute.post('/:bookId/add', addToLibrary, (req, res) => {
    res.redirect('/books');
});

booksRoute.post('/new', addNewBook, addToLibrary, (req, res) => {
    res.redirect('/books');
});

booksRoute.post('/:bookId/remove', removeFromLibrary, (req, res) => {
    res.redirect('/books');
});

export default booksRoute;
