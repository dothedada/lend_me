import { categories_db } from '../db/queries/simpleQuerys.js';
import { asyncWrapper } from './middleware.js';

export const getAllCategories = asyncWrapper(async (req, res, next) => {
    const categories = await categories_db.get();
    res.categories = categories;

    next();
});
