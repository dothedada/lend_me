import pool from '../pool.cjs';
import { booksQuery } from './books';
import { elementInTable, alreadyExist } from '../utils';

export const bookUser_db = {
    getBooks: getBooksFromUser_db,
    addBook: addBookToUser_db,
    removeBook: removeBookFromUser_db,
    removeBooks: removeAll_db('book'),
    removeUser: removeAll_db('user'),
};

/**
 * Retrieves all books associated with a user
 * @param {number|string} userId - User ID to fetch books for
 * @returns {Promise<Array<object>>} Array of book objects
 * @throws {Error} If userId is invalid or query fails
 */
const getBooksFromUser_db = async (userId) => {
    if (userId === undefined) {
        throw new Error('Must provide userId to fetch the books');
    }
    if (!(await elementInTable('users', userId))) {
        throw new Error(`There is no user with id '${userId}'`);
    }

    const query = `
	${booksQuery}
	JOIN book_user ON books.id = book_user.book_id
	WHERE book_user.user_id = $1`;

    try {
        const { rows } = await pool.query(query, [userId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

/**
 * Associates a book with a user in the book_user relationship table
 * @param {number|string} bookId - Book ID to associate
 * @param {number|string} userId - User ID to associate
 * @returns {Promise<object>} The created relationship record
 * @throws {Error} If parameters are invalid or operation fails
 */
const addBookToUser_db = async (bookId, userId) => {
    if (userId === undefined || bookId === undefined) {
        throw new Error('Must provide bookId and userId to add a book');
    }
    const [userExist, bookExist] = await Promise.all([
        elementInTable('users', userId),
        elementInTable('books', bookId),
    ]);

    if (!userExist) {
        throw new Error(`There is no user with id '${userId}'`);
    }
    if (!bookExist) {
        throw new Error(`There is no book with id '${bookId}'`);
    }
    if (await alreadyExist('book_user', 'book_id', bookId, 'user_id', userId)) {
        return;
    }

    const query = `
	INSERT INTO book_user (book_id, user_id)
	VALUES ($1, $2)
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [bookId, userId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

/**
 * Removes a specific book from a user's collection
 * @param {number|string} bookId - Book ID to remove
 * @param {number|string} userId - User ID from whom to remove the book
 * @returns {Promise<object>} The deleted relationship record
 * @throws {Error} If parameters are invalid or operation fails
 */
const removeBookFromUser_db = async (bookId, userId) => {
    if (userId === undefined || bookId === undefined) {
        throw new Error('Must provide bookId and userId');
    }

    const query = `
	DELETE FROM book_user
	WHERE book_id = $1 AND user_id = $2
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [bookId, userId]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

/**
 * Removes all book-user relationships by attribute (user or book)
 * @param {'user'|'book'} attribute - Type of relationship to clear
 * @returns {function} Async function that takes an ID and performs the deletion
 * @throws {Error} If parameters are invalid or operation fails
 */
const removeAll_db = (attribute) => async (id) => {
    if (attribute === undefined || id === undefined) {
        throw new Error('Must provide attribute and id');
    }
    if (!['user', 'book'].includes(attribute)) {
        throw new Error(`attribute '${attribute}' is not valid`);
    }

    if (!(await elementInTable(`${attribute}s`, id))) {
        throw new Error(`${attribute} with the id '${id}' does not exist`);
    }

    const query = `
	DELETE FROM book_user
	WHERE ${attribute}_id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};
