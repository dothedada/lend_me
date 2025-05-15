import { editorials_db } from '../db/queries/simpleQuerys.js';
import { asyncWrapper, setValidationResult } from './middleware.js';
import { CustomErr, editorialRules, errorMsg } from './validations.js';

export const getAllEditorials = asyncWrapper(async (req, res, next) => {
    const editorials = await editorials_db.get();
    res.editorials = editorials;

    next();
});

export const getEditorialData = asyncWrapper(async (req, res, next) => {
    const { editorialId } = req.params;
    if (!editorialId) {
        throw new CustomErr(
            errorMsg.editorials.noIdParam,
            404,
            'missingParams',
        );
    }

    const editorialData = await editorials_db.get({ id: editorialId });
    res.editorial = editorialData;

    next();
});

export const editorialValidation = [editorialRules, setValidationResult];

export const updateEditorialData = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const editorialUpdateData = req.body;
    if (!editorialUpdateData) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    const updatedData = await editorials_db.put(editorialUpdateData);
    res.editorial = updatedData;

    next();
});
