import { Router } from 'express';
import {
    deleteRequest,
    denyRequest,
    requestBook,
    acceptRequest,
    returnBook,
} from '../controllers/lends.js';

const lendsRoute = Router();

lendsRoute.post('/request', requestBook, (req, res) => {
    res.redirect('/books');
});

lendsRoute.post('/cancel', deleteRequest, (req, res) => {
    res.redirect('/');
});

lendsRoute.post('/deny', denyRequest, (req, res) => {
    res.redirect('/');
});

lendsRoute.post('/accept', acceptRequest, (req, res) => {
    res.redirect('/');
});

lendsRoute.post('/return', returnBook, (req, res) => {
    res.redirect('/');
});

export default lendsRoute;
