import { authors_db } from '../db/queries/simpleQuerys.js';
import { authorRules, CustomErr, errorMsg } from './validations.js';
import { asyncWrapper, setValidationResult } from './middleware.js';

export const getAllAuthors = asyncWrapper(async (req, res, next) => {
    const authors = await authors_db.get();
    if (authors.length === 0) {
        throw new CustomErr(errorMsg.authors.noItems, 404, 'noItemsData');
    }

    res.authors = authors;

    next();
});

export const getAuthorData = asyncWrapper(async (req, res, next) => {
    const { authorId } = req.params;
    if (!authorId) {
        throw new CustomErr(errorMsg.authors.noIdParam, 404, 'noItemsData');
    }

    const authorData = await authors_db.get({ id: authorId });
    if (!authorData) {
        throw new CustomErr(errorMsg.authors.notFound, 404, 'noItemFound');
    }

    res.author = authorData;

    next();
});

export const authorValidation = [authorRules, setValidationResult];

export const updateAuthorData = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const authorUpdatedData = req.body;
    const updatedData = await authors_db.put(authorUpdatedData);
    if (!updatedData) {
        throw new CustomErr(errorMsg.authors.update, 500);
    }

    res.author = updatedData;

    next();
});
