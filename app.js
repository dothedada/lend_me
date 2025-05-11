// packages and lib middleware
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';

// functionality
import { checkUserLog } from './controllers/login.js';

// Routes
import loginRoute from './routes/logginRoute.js';
import homeRoute from './routes/homeRoute.js';
import booksRoute from './routes/booksRoute.js';
import detailsRoute from './routes/detailRoute.js';
import searchRoute from './routes/searchRoute.js';
import friendsRoute from './routes/friendsRoute.js';
import lendsRoute from './routes/lendsRoute.js';
import meRoute from './routes/meRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/login', loginRoute);
app.use(checkUserLog);
app.use('/', homeRoute);
app.use('/books', booksRoute);
app.use('/search', searchRoute);
app.use('/detail', detailsRoute);
app.use('/friends', friendsRoute);
app.use('/lends', lendsRoute);
app.use('/me', meRoute);

app.use(express.static('public'));
// TODO: err if no user data

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Al aire en el puerto', PORT);
});
