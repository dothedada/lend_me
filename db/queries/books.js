import pool from '../pool.cjs';
import { SEARCH_LIMIT } from '../query_settings.js';
import { queryMethods } from './simpleQuerys_lib.js';

export const books_db = {
    getId: getBookId_db,
    getBy: getBooksBy_db,
    find: findBooksWith_db,
    add: insertBook_db,
    put: updateBook_db,
    remove: removeBook_db,
};

export const booksQuery = `
SELECT DISTINCT ON (books.id)
	books.id AS id,
	books.title AS title, 
	authors.name AS author,
	editorials.name AS editorial,
	categories.category AS category,
	books.year AS year, 
	books.sinopsys AS sinopsys, 
	books.image AS photo, 
	books.url AS url
FROM books 
JOIN authors ON books.author_id = authors.id 
JOIN editorials ON books.editorial_id = editorials.id
JOIN categories ON books.category_id = categories.id`;

const searchKeys = ['title', 'author', 'editorial', 'category', 'year'];
const bookKeys = [...searchKeys, 'sinopsys', 'url', 'image'];

/**
 * Gets book(s) by ID
 * @param {number|string} [id] - Optional book ID
 * @returns {Promise<object|Array<object>>}
 *   - Single book object when ID is provided (undefined if not found)
 *   - Array of all books when no ID is provided
 * @throws {Error} If database query fails
 */
const getBookId_db = async (id) => {
    let query = booksQuery;
    const values = [];
    if (id) {
        query += ' WHERE id = $1';
        values.push(id);
    }

    try {
        const { rows } = await pool.query(query, values);
        return id ? rows[0] : rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

/**
 * Gets books by specific field
 * @param {string} parameter - Field to search by (title, author, editorial, category, or year)
 * @param {string} value - Search value
 * @returns {Promise<Array<object>>} Array of matching books
 * @throws {Error} If invalid parameter is provided or database query fails
 */
const getBooksBy_db = async (parameter, value) => {
    if (!searchKeys.includes(parameter)) {
        throw new Error(`Invalid query parameter '${parameter}'`);
    }

    let query = `${booksQuery} WHERE ${parameter}::text ILIKE $1`;

    try {
        const { rows } = await pool.query(query, [`%${value}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

/**
 * Searches books across all searchable fields
 * @param {string} value - Search term
 * @returns {Promise<Array<object>>} Array of matching books (limited to SEARCH_LIMIT)
 * @throws {Error} If database query fails
 */
const findBooksWith_db = async (value) => {
    if (!value.trim()) {
        return [];
    }

    const fields = [];
    for (const key of searchKeys) {
        fields.push(`${key}::text ILIKE $1`);
    }
    let query = `
	${booksQuery} 
	WHERE ${fields.join(' OR ')}
	LIMIT ${SEARCH_LIMIT}`;

    try {
        const { rows } = await pool.query(query, [`%${value}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

/**
 * Gets or creates an ID for a related entity (author/editorial/category)
 * @param {string} value - Name/value to search for
 * @param {object} queryMethod - Query methods object with get/add functions
 * @returns {Promise<number>} ID of the found or created entity
 * @throws {Error} If value is empty or operation fails
 * @private
 */
const getId = async (value, queryMethod) => {
    const cleanValue = value.trim();
    if (cleanValue === '') {
        throw new Error('Value cannot be an empty string');
    }

    let id = await queryMethod.get(cleanValue);
    if (id === undefined) {
        id = await queryMethod.add(cleanValue);
    }
    return id;
};

/**
 * Inserts a new book with related entities
 * @param {object} values - Book data including:
 *   @param {string} values.title - Book title
 *   @param {string} values.author - Author name
 *   @param {string} values.editorial - Editorial name
 *   @param {number} values.year - Publication year
 *   @param {string} values.category - Category name
 *   @param {string} values.sinopsys - Book synopsis
 *   @param {string} values.url - Book URL
 *   @param {string} values.image - Image URL
 * @returns {Promise<void>}
 * @throws {Error} If insertion fails or transaction fails
 */
const insertBook_db = async (values) => {
    const client = await pool.connect();

    const authorInBook = queryMethods(client, 'authors', ['get', 'add']);
    const editorialInBook = queryMethods(client, 'editorials', ['get', 'add']);
    const categoryInBook = queryMethods(client, 'categories', ['get', 'add']);

    try {
        await client.query('BEGIN');
        const {
            title,
            author,
            editorial,
            year,
            category,
            sinopsys,
            url,
            image,
        } = values;

        const authorId = await getId(author, authorInBook);
        const editorialId = await getId(editorial, editorialInBook);
        const categoryId = await getId(category, categoryInBook);

        const query = `
		INSERT INTO books 
		(title, author_id, editorial_id, year, category_id, sinopsys, url, image)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

        await client.query(query, [
            title,
            authorId,
            editorialId,
            year,
            categoryId,
            sinopsys,
            url,
            image,
        ]);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Cannot insert the book: ${err.message}`);
    } finally {
        client.release();
    }
};

/**
 * Updates an existing book
 * @param {object} valuesToUpdate - Book data to update including:
 *   @param {number} valuesToUpdate.id - Required book ID
 *   @param {string} [valuesToUpdate.title] - Updated title
 *   @param {string} [valuesToUpdate.author] - Updated author
 *   @param {string} [valuesToUpdate.editorial] - Updated editorial
 *   @param {number} [valuesToUpdate.year] - Updated year
 *   @param {string} [valuesToUpdate.category] - Updated category
 *   @param {string} [valuesToUpdate.sinopsys] - Updated synopsis
 *   @param {string} [valuesToUpdate.url] - Updated URL
 *   @param {string} [valuesToUpdate.image] - Updated image URL
 * @returns {Promise<void>}
 * @throws {Error} If update fails, ID is missing, or transaction fails
 */
const updateBook_db = async (valuesToUpdate) => {
    const { id } = valuesToUpdate;
    if (id === undefined) {
        throw new Error(`Missing books id in values to update`);
    }

    const client = await pool.connect();

    const authorInBook = queryMethods(client, 'authors', ['get', 'add']);
    const editorialInBook = queryMethods(client, 'editorials', ['get', 'add']);
    const categoryInBook = queryMethods(client, 'categories', ['get', 'add']);

    try {
        await client.query('BEGIN');

        const keyToUpdate = [];
        const value = [];
        let paramIndex = 1;

        for (const key of bookKeys) {
            if (valuesToUpdate[key] === undefined) {
                continue;
            }

            if (key === 'author') {
                value.push(await getId(valuesToUpdate[key], authorInBook));
            } else if (key === 'editorial') {
                value.push(await getId(valuesToUpdate[key], editorialInBook));
            } else if (key === 'category') {
                value.push(await getId(valuesToUpdate[key], categoryInBook));
            } else {
                value.push(valuesToUpdate[key]);
            }
            keyToUpdate.push(`${key} = $${paramIndex}`);
            paramIndex++;
        }
        value.push(id);

        const query = `
		UPDATE books
		SET ${keyToUpdate.join(', ')}
		WHERE id = $${paramIndex}
		RETURNING *`;

        await client.query(query, value);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Cannot update the book: ${err.message}`);
    } finally {
        client.release();
    }
};

/**
 * Removes a book by ID
 * @param {number} id - Book ID to remove
 * @returns {Promise<object>} The deleted book record
 * @throws {Error} If ID is invalid, book doesn't exist, or deletion fails
 */
const removeBook_db = async (id) => {
    if (id === undefined || isNaN(+id)) {
        throw new Error(`'${id}' is not a valid id`);
    }

    const query = `
	DELETE FROM books
	WHERE id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [id]);
        if (!rows.length) {
            throw new Error(`The id '${id}' does not exist in books`);
        }
        return rows[0];
    } catch (err) {
        throw new Error(`Failed to delete book with id=${id}: ${err.message}`);
    }
};
