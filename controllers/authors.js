import { authors_db } from '../db/queries/simpleQuerys.js';

export const getAllAuthors = async (req, res, next) => {
    const authors = await authors_db.get();
    res.authors = authors;

    next();
};
