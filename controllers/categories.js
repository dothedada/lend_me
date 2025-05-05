import { categories_db } from '../db/queries/simpleQuerys.js';

export const getAllCategories = async (req, res, next) => {
    const categories = await categories_db.get();
    res.categories = categories;

    next();
};
