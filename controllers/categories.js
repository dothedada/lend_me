import { categories_db } from '../db/queries/simpleQuerys.js';
import { asyncWrapper } from './middleware.js';
import { CustomErr, errorMsg } from './validations.js';

export const getAllCategories = asyncWrapper(async (req, res, next) => {
    const categories = await categories_db.get();
    if (categories.length === 0) {
        throw new CustomErr(errorMsg.categories.noItems, 404, 'noItemsData');
    }

    res.categories = categories;

    next();
});
