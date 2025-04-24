import pool from '../pool.cjs';
import { booksDataQuery } from './books.js';

const libraryDataQuery = `
SELECT
	books.title as book,
	authors.name as author,
	library.name AS library,
	users.name AS owner
FROM books
JOIN authors ON books.author_id = authors.id
JOIN book_library ON books.id = book_library.book_id
JOIN library ON book_library.library_id = library.id
JOIN users ON library.owner_id = users.id 
`;

export const getBooksFrom_db = async (libraryOrOwner) => {
    const query = `
	${libraryDataQuery} 
	WHERE library ILIKE $1 OR owner ILIKE $1`;

    try {
        const { rows } = await pool.query(query, [`${libraryOrOwner}`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const getBooksInLibrary_db = async (notIn = false) => {
    const inLibrary = notIn ? 'NOT EXISTS ' : 'EXISTS ';
    const query = `
	${booksDataQuery}
	WHERE ${inLibrary}(
		SELECT 1 
		FROM book_library
		WHERE book_library.book_id = books.id
	)`;

    try {
        const { rows } = await pool.query(query);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const removeBooksWithoutLibrary = async () => {
    try {
        const { rows } = await pool.query(`
			DELETE FROM books
			WHERE id NOT IN (SELECT book_id FROM book_library)
			RETURNING *`);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};
