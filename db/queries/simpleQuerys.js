import { CustomErr, errorMsg } from '../../controllers/validations.js';
import pool from '../pool.cjs';
import { createQueryArrayReferences, validateId } from '../utils.js';
import { queryMethods } from './simpleQuerys_lib.js';

export const authors_db = queryMethods(pool, 'authors');
export const editorials_db = queryMethods(pool, 'editorials');
export const categories_db = queryMethods(pool, 'categories');

export const users_db = {
    ...queryMethods(pool, 'users', ['get', 'find', 'add', 'put']),
    getUsersData: async (friendsIds) => {
        if (friendsIds.length === 0) {
            return [];
        }
        const { references, values } = createQueryArrayReferences(friendsIds);

        const query = `
		SELECT *
		FROM users
		WHERE id IN (${references.join(', ')})`;

        try {
            const { rows } = await pool.query(query, values);
            return rows;
        } catch (err) {
            throw new CustomErr(errorMsg.dbQuery('users', err));
        }
    },
    kill: async (userId) => {
        const id = validateId(userId);

        const query = `
		UPDATE users
		SET status = 'dead'
		WHERE id = $1
		RETURNING *`;

        try {
            const { rows } = await pool.query(query, [id]);
            return rows;
        } catch (err) {
            throw new CustomErr(errorMsg.dbQuery('users', err));
        }
    },
};

export const requests_db = queryMethods(pool, 'friend_request', [
    'add',
    'delete',
]);
