import newPool from './pool.cjs';

const booksQuery = `
SELECT 
	books.title AS title, 
	authors.name AS author,
	editorials.name AS editorial,
	books.year AS year, 
	books.sinopsys AS sinopsys, 
	books.image AS photo, 
	books.url AS url, 
FROM books 
JOIN authors ON books.author_id = authors.id 
JOIN editorials ON books.editorial_id = editorials.id`;

export const getAllBooks_db = async () => {
    const { rows } = await newPool.query(booksQuery);
    return rows;
};

export const getBookById_db = async (id) => {
    const query = `${booksQuery} WHERE id = $1`;

    try {
        const { rows } = await newPool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const getBooksBy_db = async (parameter, value) => {
    const validParameters = ['title', 'author', 'editorial', 'year'];
    if (!validParameters.includes(parameter)) {
        throw new Error(`Invalid query parameter '${parameter}'`);
    }

    let query = `${booksQuery} WHERE `;
    query += parameter === 'year' ? 'year = $1' : `${parameter} ILIKE $1`;
    const valueString = parameter === 'year' ? value : `%${value}%`;

    try {
        const { rows } = await newPool.query(query, [valueString]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const getBooksWith_db = async (value) => {
    const fields = ['title', 'author', 'editorial', 'sinopsys']
        .map((field) => `${field} ILIKE $1`)
        .join(' OR ');
    const query = `${booksQuery} WHERE ${fields}`;

    try {
        const { rows } = await newPool.query(query, [`%${value}%`]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};
