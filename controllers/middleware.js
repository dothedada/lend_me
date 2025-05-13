import { validationResult } from 'express-validator';

export const setValidationResult = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.errors = errors.array().reduce((acc, error) => {
            if (!acc[error.path]) {
                acc[error.path] = [];
            }
            acc[error.path].push(error);

            return acc;
        }, {});
    }

    next();
};
