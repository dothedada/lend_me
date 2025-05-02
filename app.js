import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';

import homeRoute from './routes/homeRoute.js';
import { checkUserLog } from './controllers/login.js';
import loginRoute from './routes/logginRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/login', loginRoute, (req, res) => {});
app.use(checkUserLog);
app.use('/', homeRoute);

app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Al aire en el puerto', PORT);
});
