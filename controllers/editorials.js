import { editorials_db } from '../db/queries/simpleQuerys.js';

export const getAllEditorials = async (req, res, next) => {
    const editorials = await editorials_db.get();
    res.editorials = editorials;

    next();
};
