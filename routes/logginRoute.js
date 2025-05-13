import { Router } from 'express';
import {
    inputValidation,
    createUser,
    createSessionCookie,
    logType,
} from '../controllers/login.js';

const loginRoute = Router();

loginRoute.get('/', (_, res) => {
    res.render('login.ejs');
});

loginRoute.post(
    '/',
    inputValidation,
    logType,
    createSessionCookie,
    (_, res) => {
        const { name, email } = res.cookieData.data;
        if (res.errors !== undefined) {
            const { name: nameErr, email: emailErr } = res.errors;
            res.locals.name = nameErr;
            res.locals.email = emailErr;
            res.status(400).render('login.ejs', {
                errors: res.errors,
                name,
                email,
            });
        } else if (res.cookieData?.make) {
            res.redirect('/');
        } else {
            res.redirect(`/login/new?name=${name}&email=${email}`);
        }
    },
);

loginRoute.get('/new', (req, res) => {
    const { name, email } = req.query;
    res.render('newUser', { name, email });
});

loginRoute.post(
    '/new',
    inputValidation,
    logType,
    createUser,
    createSessionCookie,
    (_, res) => {
        if (res.errors !== undefined) {
            const { name, email } = res.cookieData.data;

            return res.status(400).render('newUser', {
                name,
                email,
                errors: res.errors,
            });
        }

        res.redirect('/');
    },
);

export default loginRoute;
