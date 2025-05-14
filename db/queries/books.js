import pool from '../pool.cjs';
import {
    booksInventoryQuery,
    SEARCH_LIMIT,
    searchParams,
    searchBookParams,
    bookQueryColumns,
    tables,
} from '../query_settings.js';
import { validateId } from '../utils.js';
import { queryMethods } from './simpleQuerys_lib.js';

const getBookId_db = async (id) => {
    let query = booksInventoryQuery(bookQueryColumns.id);
    const values = [];
    if (id) {
        query += ' WHERE books.id = $1';
        values.push(id);
    }

    try {
        const { rows } = await pool.query(query, values);
        return id ? rows[0] : rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

const getBooksOwnedBy_db = async (ids = [], notInIds = []) => {
    if (ids.length === 0) {
        return [];
    }

    const idsSecuence = ids.map((_, i) => `$${i + 1}`).join(', ');
    let query = `
	${booksInventoryQuery()}
	WHERE book_user.user_id IN (${idsSecuence})`;

    let queryElements = ids;

    if (notInIds.length > 0) {
        const baseIndex = ids.length;
        const excludeBooksOf = notInIds
            .map((_, i) => `$${i + baseIndex + 1}`)
            .join(', ');

        query += `
		AND NOT EXISTS (
			SELECT 1
			FROM book_user bu2
			WHERE bu2.book_id = books.id 
			AND bu2.user_id IN (${excludeBooksOf}) 
		)`;

        queryElements = [...queryElements, ...notInIds];
    }

    try {
        const { rows } = await pool.query(query, queryElements);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

const getBooksBy_db = async (parameter, value) => {
    if (!searchParams.includes(parameter)) {
        throw new Error(`Invalid query parameter '${parameter}'`);
    }

    let query = `
	${booksInventoryQuery(bookQueryColumns.id)} 
	WHERE ${parameter}::text ILIKE $1`;

    try {
        const { rows } = await pool.query(query, [`%${value}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

const bookSearchWithinFriends_db = async (lookFor, friendsIds, userId) => {
    const search = String(lookFor.trim());
    if (!search || !userId) {
        throw new Error('Must provide both parameter to do the search');
    }

    const fields = [];
    for (const key in searchBookParams) {
        fields.push(`${searchBookParams[key]}::text ILIKE $1`);
    }

    const query = `
	${booksInventoryQuery()}
	WHERE (${fields.join(' OR ')})
	AND book_user.user_id IN (${friendsIds.join(', ')})
	AND NOT EXISTS (
		SELECT 1
		FROM book_user bu2
		WHERE bu2.book_id = books.id
		AND bu2.user_id = ${userId}
	)`;

    try {
        const { rows } = await pool.query(query, [`%${search}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

const findBooksWith_db = async (value) => {
    if (!value.trim()) {
        return [];
    }

    const fields = [];
    for (const key of searchParams) {
        fields.push(`${key}::text ILIKE $1`);
    }

    let query = `
	${booksInventoryQuery(bookQueryColumns.id)} 
	WHERE ${fields.join(' OR ')}
	LIMIT ${SEARCH_LIMIT}`;

    try {
        const { rows } = await pool.query(query, [`%${value}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'books' failed: ${err.message}`);
    }
};

const getId = async (value, queryMethod) => {
    let element = await queryMethod.get(value);
    if (element === undefined) {
        element = await queryMethod.add(value);
    }
    return element.id;
};

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

        const authorId = await getId({ name: author }, authorInBook);
        const editorialId = await getId({ name: editorial }, editorialInBook);
        const categoryId = await getId({ category }, categoryInBook);

        const query = `
		INSERT INTO books 
		(title, author_id, editorial_id, year, category_id, sinopsys, url, image)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING *`;

        const { rows } = await client.query(query, [
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

        return rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Cannot insert the book: ${err.message}`);
    } finally {
        client.release();
    }
};

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

        for (const key of tables.books) {
            if (valuesToUpdate[key] === undefined || key === 'id') {
                continue;
            }

            let key_db = key;
            if (key === 'author') {
                const auth = await getId(
                    { name: valuesToUpdate[key] },
                    authorInBook,
                );
                key_db = 'author_id';
                value.push(auth.id);
            } else if (key === 'editorial') {
                const ed = await getId(
                    { name: valuesToUpdate[key] },
                    editorialInBook,
                );
                key_db = 'editorial_id';
                value.push(ed.id);
            } else if (key === 'category') {
                const cat = await getId(
                    { category: valuesToUpdate[key] },
                    categoryInBook,
                );
                key_db = 'category_id';
                value.push(cat.id);
            } else {
                value.push(valuesToUpdate[key]);
            }
            keyToUpdate.push(`${key_db} = $${paramIndex}`);
            paramIndex++;
        }
        value.push(id);

        const query = `
		UPDATE books
		SET ${keyToUpdate.join(', ')}
		WHERE id = $${paramIndex}
		RETURNING *`;

        const { rows } = await client.query(query, value);
        await client.query('COMMIT');
        return rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Cannot update the book: ${err.message}`);
    } finally {
        client.release();
    }
};

const removeBook_db = async (id) => {
    const cleanId = validateId(id);

    const query = `
	DELETE FROM books
	WHERE id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
        if (!rows.length) {
            throw new Error(`The id '${id}' does not exist in books`);
        }
        return rows[0];
    } catch (err) {
        throw new Error(`Failed to delete book with id=${id}: ${err.message}`);
    }
};

export const books_db = {
    getBooks: getBookId_db,
    getBooksOwnedBy: getBooksOwnedBy_db,
    getBy: getBooksBy_db,
    find: findBooksWith_db,
    search: bookSearchWithinFriends_db,
    add: insertBook_db,
    put: updateBook_db,
    remove: removeBook_db,
};
