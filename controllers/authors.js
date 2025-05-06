import { authors_db } from '../db/queries/simpleQuerys.js';

export const getAllAuthors = async (req, res, next) => {
    const authors = await authors_db.get();
    res.authors = authors;

    next();
};

export const getAuthorData = async (req, res, next) => {
    const { authorId } = req.params;
    if (!authorId) {
        throw new Error('No author id on the params');
    }
    const authorData = await authors_db.get({ id: authorId });
    res.author = authorData;

    next();
};

export const updateAuthorData = async (req, res, next) => {
    const authorUpdatedData = req.body;
    const updatedData = await authors_db.put(authorUpdatedData);
    res.author = updatedData;

    next();
};
