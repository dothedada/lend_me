import { Router } from 'express';
import {
    getAllBooks,
    getFriendsBooks,
    getOwnedBooks,
} from '../controllers/books.js';
import { users_db } from '../db/queries/simpleQuerys.js';

const homeRoute = Router();

homeRoute.get('/', getOwnedBooks, getFriendsBooks, async (req, res) => {
    const id = req.cookies.lend_me_usr;
    const userData = await users_db.get(id);

    res.render('dashboard.ejs', {
        user: userData.name,
        userBooks: res.books.user,
        friendsBooks: res.books.friends,
    });
});

export default homeRoute;
