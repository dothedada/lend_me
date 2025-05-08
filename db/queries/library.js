import pool from '../pool.cjs';
import { booksInventoryQuery, bookQueryColumns } from '../query_settings.js';
import { elementExists, recordExists, validateId } from '../utils.js';

const getBooksFromUsers_db = async (usersIds) => {
    if (usersIds === undefined || !Array.isArray(usersIds)) {
        throw new Error('Must provide userId to fetch the books');
    }

    const validIds = elementExists('users', usersIds);
    const keysToCheck = validIds.map((_, i) => `$${i + 1}`);

    const query = `
	${booksInventoryQuery()}
	WHERE book_user.user_id IN (${keysToCheck.join(', ')})`;

    try {
        const { rows } = await pool.query(query, validIds);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

const addBookToUser_db = async (bookId, userId) => {
    const cleanBookId = validateId(bookId);
    const cleanUserId = validateId(userId);

    const [userExist, bookExist] = await Promise.all([
        elementExists('books', [cleanBookId]),
        elementExists('users', [cleanUserId]),
    ]);

    if (!userExist) {
        throw new Error(`There is no user with id '${userId}'`);
    }
    if (!bookExist) {
        throw new Error(`There is no book with id '${bookId}'`);
    }
    if (
        await recordExists('book_user', {
            book_id: cleanBookId,
            user_id: cleanUserId,
        })
    ) {
        return;
    }

    const query = `
	INSERT INTO book_user (book_id, user_id)
	VALUES ($1, $2)
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanBookId, cleanUserId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

const removeBookFromUser_db = async (bookId, userId) => {
    const cleanBookId = validateId(bookId);
    const cleanUserId = validateId(userId);

    const query = `
	DELETE FROM book_user
	WHERE book_id = $1 AND user_id = $2
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanBookId, cleanUserId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

const removeAll_db = (attribute) => async (id) => {
    const cleanId = validateId(id);
    if (attribute === undefined || id === undefined) {
        throw new Error('Must provide attribute and id');
    }
    if (!['user', 'book'].includes(attribute)) {
        throw new Error(`attribute '${attribute}' is not valid`);
    }

    if ((await elementExists(`${attribute}s`, [cleanId])).length === 0) {
        throw new Error(`${attribute} with the id '${id}' does not exist`);
    }

    const query = `
	DELETE FROM book_user
	WHERE ${attribute}_id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const bookUser_db = {
    getBooks: getBooksFromUsers_db,
    addBook: addBookToUser_db,
    removeBook: removeBookFromUser_db,
    removeBooks: removeAll_db('book'),
    removeUser: removeAll_db('user'),
};
