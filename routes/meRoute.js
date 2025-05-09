import { Router } from 'express';
import { getUserTransactions } from '../controllers/lends.js';
import { updateUser, deleteUser } from '../controllers/login.js';

const meRoute = Router();

meRoute.get('/', getUserTransactions, (req, res) => {
    const userData = req.user;
    const { returned } = res.transactions;

    res.render('me.ejs', { user: userData, returnedBooks: returned });
});

meRoute.post('/update', updateUser, (req, res) => {
    res.redirect('/me');
});

meRoute.post('/delete', deleteUser, (req, res) => {
    res.redirect('/');
});

export default meRoute;
