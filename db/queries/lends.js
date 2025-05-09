import pool from '../pool.cjs';
import {
    lendsQuery,
    lendsQueryColumns,
    lendStatus,
} from '../query_settings.js';
import { elementExists, recordExists, validateId } from '../utils.js';

const getAllLends_db = async () => {
    try {
        const { rows } = await pool.query(lendsQuery);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

const getUserTransactions_db = async (userId) => {
    const id = validateId(userId);

    const query = `
	${lendsQuery}
	WHERE lends.to_id = $1 OR lends.owner_id = $1`;

    try {
        const { rows } = await pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

const getLendsBy_db = async (valueObj) => {
    const [key, rawValue] = Object.entries(valueObj)[0];
    let value = `${rawValue}`.trim();

    if (!Object.keys(lendsQueryColumns).includes(key)) {
        throw new Error(`'${key}' is not a valid column for lends query`);
    }
    if (value === '') {
        throw new Error(`'${value}' is not a valid value`);
    }

    let whereClause = '';
    if (key.startsWith('date_')) {
        whereClause += `WHERE ${key}::DATE = $1::DATE`;
    } else if (key.endsWith('_id')) {
        whereClause += `WHERE ${key} = $1`;
    } else {
        whereClause += `WHERE ${key} ILIKE $1`;
        value = `%${value}%`;
    }

    const query = `${lendsQuery} ${whereClause}`;

    try {
        const { rows } = await pool.query(query, [value]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

const requestLend_db = async (values) => {
    const { book_id, owner_id, to_id } = values;

    const cleanBook_id = validateId(book_id);
    const cleanFrom_id = validateId(owner_id);
    const cleanTo_id = validateId(to_id);

    const elementsExists = await Promise.all([
        elementExists('users', [cleanFrom_id]),
        elementExists('users', [cleanTo_id]),
        elementExists('books', [cleanBook_id]),
    ]);
    if (elementsExists.some((e) => !e)) {
        throw new Error('User or book does not exist');
    }

    const userHasBook = await recordExists('book_user', {
        book_id: book_id,
        user_id: owner_id,
    });
    if (!userHasBook) {
        throw new Error(`the book is not owned by this user`);
    }

    const bookNotAvailable = await recordExists('lends', {
        book_id: book_id,
        owner_id: owner_id,
        status: 'active',
    });

    if (bookNotAvailable) {
        throw new Error(`the book '${book_id}' is not available`);
    }

    const query = `
	INSERT INTO lends (book_id, owner_id, to_id)
	VALUES ($1, $2, $3)
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [book_id, owner_id, to_id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

const deleteRequest_db = async (lendId) => {
    const id = validateId(lendId);
    const query = `
	DELETE FROM lends WHERE id = $1`;

    try {
        const { rows } = await pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

const updateLend_db = async (lendId, status) => {
    if (!lendStatus.includes(status)) {
        throw new Error(`'${status}' is not a valid lend status`);
    }
    const cleanId = validateId(lendId);

    const date_returned =
        status === 'returned' ? ', date_returned = CURRENT_DATE' : '';

    const query = `
	UPDATE lends
	SET status = $2 ${date_returned}
	WHERE id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanId, status]);
        if (rows.length === 0) {
            throw new Error(`there is no lends with id ${lendId}`);
        }
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

export const lends_db = {
    getAll: getAllLends_db,
    getTransactions: getUserTransactions_db,
    deleteRequest: deleteRequest_db,
    getBy: getLendsBy_db,
    lend: requestLend_db,
    changeStatus: updateLend_db,
};
