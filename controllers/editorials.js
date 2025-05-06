import { editorials_db } from '../db/queries/simpleQuerys.js';

export const getAllEditorials = async (req, res, next) => {
    const editorials = await editorials_db.get();
    res.editorials = editorials;

    next();
};

export const getEditorialData = async (req, res, next) => {
    const { editorialId } = req.params;
    if (!editorialId) {
        throw new Error('No editorial id on the params');
    }
    const editorialData = await editorials_db.get({ id: editorialId });
    res.editorial = editorialData;

    next();
};

export const updateEditorialData = async (req, res, next) => {
    const editorialUpdateData = req.body;
    const updatedData = await editorials_db.put(editorialUpdateData);
    res.editorial = updatedData;

    next();
};
