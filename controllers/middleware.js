import { validationResult, matchedData } from 'express-validator';

export const asyncWrapper = (asyncCB) => {
    if (!(asyncCB instanceof (async () => {}).constructor)) {
        throw new Error(`'${asyncCB}' is not an async function`);
    }

    return (...params) => {
        const promisedReturn = asyncCB(...params);
        const next = params[params.length - 1];

        return Promise.resolve(promisedReturn).catch(next);
    };
};

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

    res.cleanData = matchedData(req);

    next();
};
