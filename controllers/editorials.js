import { editorials_db } from '../db/queries/simpleQuerys.js';
import { asyncWrapper, setValidationResult } from './middleware.js';
import { CustomErr, editorialRules, errorMsg } from './validations.js';

export const getAllEditorials = asyncWrapper(async (req, res, next) => {
    const editorials = await editorials_db.get();
    if (editorials.length === 0) {
        throw new CustomErr(errorMsg.editorials.noItems, 404, 'noItemsData');
    }

    res.editorials = editorials;

    next();
});

export const getEditorialData = asyncWrapper(async (req, res, next) => {
    const { editorialId } = req.params;
    if (!editorialId) {
        throw new CustomErr(errorMsg.editorials.noIdParam, 404, 'noItemsData');
    }

    const editorialData = await editorials_db.get({ id: editorialId });
    if (!editorialData) {
        throw new CustomErr(errorMsg.editorials.notFound, 404, 'noItemFound');
    }

    res.editorial = editorialData;

    next();
});

export const editorialValidation = [editorialRules, setValidationResult];

export const updateEditorialData = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const editorialUpdateData = req.body;
    const updatedData = await editorials_db.put(editorialUpdateData);
    if (!updatedData) {
        throw new CustomErr(errorMsg.editorials.update);
    }
    res.editorial = updatedData;

    next();
});
