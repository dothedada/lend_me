export const makeInputErrorsObject = (errorsArray) =>
    errorsArray.array().reduce((acc, error) => {
        if (!acc[error.path]) {
            acc[error.path] = [];
        }
        acc[error.path].push(error);

        return acc;
    }, {});
