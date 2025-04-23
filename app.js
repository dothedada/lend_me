import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import homeRoute from './routes/homeRoute.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', homeRoute);

app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Al aire en el puerto', PORT);
});
