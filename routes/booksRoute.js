import { Router } from 'express';
import {
    getFriendsBooks,
    getOwnedBooks,
    pickRandomBooks,
} from '../controllers/books.js';

const booksRoute = Router();

booksRoute.get('/', getOwnedBooks, getFriendsBooks, async (req, res) => {
    const userData = req.user;

    const friendsBooksShelf = pickRandomBooks(res.books.friends, 3);

    res.render('books.ejs', {
        user: userData,
        h1: `${userData.name}'s & friends books`,
        friendsBooks: friendsBooksShelf,
        userBooks: res.books.user,
    });
});

export default booksRoute;
