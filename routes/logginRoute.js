import { Router } from 'express';
import {
    logUser,
    createUser,
    createSessionCookie,
} from '../controllers/login.js';

const loginRoute = Router();

loginRoute.get('/', (req, res) => {
    res.render('login.ejs');
});

loginRoute.post('/', logUser, createSessionCookie, (req, res) => {
    if (res.sessionCookie.make) {
        res.redirect('/');
    } else {
        const { name, email } = res.userFields;
        res.redirect(`/login/new?name=${name}&email=${email}`);
    }
});

loginRoute.get('/new', (req, res) => {
    const { name, email } = req.query;
    res.render('newUser', { name, email });
});

loginRoute.post('/new', createUser, createSessionCookie, (req, res) => {
    res.redirect('/');
});

export default loginRoute;
