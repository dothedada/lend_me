import pool from '../pool.cjs';
import { createQueryArrayReferences } from '../utils.js';
import { queryMethods } from './simpleQuerys_lib.js';

export const authors_db = queryMethods(pool, 'authors');
export const editorials_db = queryMethods(pool, 'editorials');
export const categories_db = queryMethods(pool, 'categories');

export const users_db = {
    ...queryMethods(pool, 'users'),
    getUsersData: async (friendsIds) => {
        const { references, values } = createQueryArrayReferences(friendsIds);

        const query = `
		SELECT *
		FROM users
		WHERE id IN (${references.join(', ')})`;

        try {
            const { rows } = await pool.query(query, values);
            return rows;
        } catch (err) {
            throw new Error(`Cannot make the data request to 'users': ${err}`);
        }
    },
};

export const requests_db = queryMethods(pool, 'friend_request', [
    'add',
    'delete',
]);
