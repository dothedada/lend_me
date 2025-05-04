import pool from '../pool.cjs';
import { elementExists, recordExists, validateId } from '../utils.js';

const lendKeys = [
    'lends.id',
    'book.id',
    'book.title',
    'book.author',
    'book.author_id',
    'from_user.name',
    'to_user.name',
    'lends.to_id',
    'lends.status',
    'lends.date_taken',
    'lends.date_returned',
];

export const lendQuery = `
SELECT 
	lends.id AS "lend_id",
	book.id AS "book_id",
	book.title AS title,
	book.author AS author,
	book.author_id AS author_id,
	from_user.name AS "from_user",
	to_user.name AS "to_user",
	lends.to_id AS "to_user_id",
	lends.status AS status,
	lends.date_taken AS date_taken,
	lends.date_returned AS date_returned
FROM lends
JOIN users AS to_user ON lends.to_id = to_user.id
JOIN users AS from_user ON lends.from_id = from_user.id
JOIN (
	SELECT 
		books.id AS id,
		books.title AS title,
		books.author_id AS author_id,
		authors.name AS author
		FROM books
		JOIN authors ON books.author_id = authors.id
	) AS book ON lends.book_id = book.id
`;

/**
 * Retrieves all lending records from the database.
 * @returns {Promise<Array<Object>>} Array of lending records with detailed information.
 * @throws {Error} If the database query fails.
 */
const getAllLends_db = async () => {
    try {
        const { rows } = await pool.query(lendQuery);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

/**
 * Retrieves lending records filtered by a specific attribute and value.
 * @param {string} attribute - The field to filter by (e.g., 'book_id', 'status', 'date_taken').
 * @param {string} value - The value to match against the attribute.
 * @returns {Promise<Array<Object>>} Array of filtered lending records.
 * @throws {Error} If:
 * - The attribute is invalid.
 * - The value is empty or invalid.
 * - The database query fails.
 */
const getLendsBy_db = async (attribute, value) => {
    if (!lendKeys.includes(attribute)) {
        throw new Error(`'${attribute}' is not a valid key in lends table`);
    }
    if (!value) {
        throw new Error(`value = '${value}', is not a valid parameter`);
    }

    const cleanValue = [value.trim()];
    if (cleanValue[0] === '') {
        throw new Error(`'${value}' is not a valid value`);
    }

    let whereClause = '';
    if (attribute.startsWith('date_')) {
        whereClause += `WHERE ${attribute}::DATE = $1::DATE`;
    } else if (attribute.endsWith('_id')) {
        whereClause += `WHERE ${attribute} = $1`;
    } else {
        whereClause += `WHERE ${attribute} ILIKE $1`;
        cleanValue[0] = `%${cleanValue}%`;
    }

    const query = `${lendQuery} ${whereClause}`;

    try {
        const { rows } = await pool.query(query, cleanValue);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

/**
 * Creates a new lending record in the database.
 * Validates book ownership, user existence, and book availability before insertion.
 * @param {Object} values - Lending details.
 * @param {number} values.book_id - The ID of the book being lent.
 * @param {number} values.from_id - The ID of the user lending the book (owner).
 * @param {number} values.to_id - The ID of the user borrowing the book.
 * @returns {Promise<Array<Object>>} The newly created lending record.
 * @throws {Error} If:
 * - Required fields are missing.
 * - The book, owner, or borrower does not exist.
 * - The book is not owned by the lender.
 * - The book is already lent out.
 * - The database query fails.
 */
const insertLend_db = async (values) => {
    const { book_id, from_id, to_id } = values;

    const cleanBook_id = validateId(book_id);
    const cleanFrom_id = validateId(from_id);
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
        user_id: from_id,
    });
    if (!userHasBook) {
        throw new Error(`the book is not owned by this user`);
    }

    const bookNotAvailable = await recordExists('lends', {
        book_id: book_id,
        from_id: from_id,
        status: 'active',
    });

    if (bookNotAvailable) {
        throw new Error(`the book '${book_id}' is not available`);
    }

    const query = `
	INSERT INTO lends (book_id, from_id, to_id)
	VALUES ($1, $2, $3)
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [book_id, from_id, to_id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'lends' failed: ${err.message}`);
    }
};

/**
 * Marks a lending record as returned by updating its status and return date.
 * Only updates active lendings.
 * @param {string} lendId - The ID of the lending record to update.
 * @returns {Promise<Array<Object>>} The updated lending record.
 * @throws {Error} If:
 * - The lendId is invalid or not a number.
 * - No active lending record exists with the given ID.
 * - The database query fails.
 */
const updateLend_db = async (lendId) => {
    const cleanId = validateId(lendId);

    const query = `
	UPDATE lends
	SET date_returned = CURRENT_DATE, status = 'returned'
	WHERE id = $1 AND status = 'active'
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
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
    getBy: getLendsBy_db,
    lend: insertLend_db,
    return: updateLend_db,
};
