import newPool from './pool.cjs';

const inventoryQuery = `
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
	${inventoryQuery} 
	WHERE library ILIKE $1 OR owner ILIKE $1`;

    try {
        const { rows } = await newPool.query(query, [`${libraryOrOwner}`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const removeBooksWithoutLibrary = async () => {
    try {
        const { rows } = await newPool.query(`
			DELETE FROM books
			WHERE id NOT IN (SELECT book_id FROM book_library)
			RETURNING *`);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};
