import pool from '../pool.cjs';

const authorsFields = ['id', 'name', 'bio', 'url'];
const authorsQuery = 'SELECT * FROM authors';

export const getAllAuthors_db = async () => {
    try {
        const { rows } = await pool.query(authorsQuery);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err}`);
    }
};

export const getAuthorBy_db = async (param, value) => {
    if (!authorsFields.includes(param)) {
        throw new Error(`Invalid query parameter '${parameter}'.`);
    }

    const comparison = param === 'id' ? 'id = $1' : `${param} ILIKE $1`;
    const query = `${query} WHERE ${comparison}`;
    try {
        const { rows } = await pool.query(query, [value]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const setAuthor_db = async (name, bio = '', url = '') => {
    try {
        const { rows } = await pool.query(
            `
			INSERT INTO authors (name, bio, url)
			VALUES ($1, $2, $3)
			RETURNING *`,
            [name, bio, url],
        );
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot insert author: ${err.message}`);
    }
};

export const updateAuthor_db = async (authorData) => {
    const { id } = authorData;
    if (!id) {
        throw new Error('Missing author id');
    }

    const colsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    for (const key of authorsFields) {
        if (key === 'id' || authorData[key] === undefined) {
            continue;
        }
        colsToUpdate.push(`${key}=$${paramIndex}`);
        values.push(authorData[key]);
        paramIndex++;
    }

    const query = `
	UPDATE authors 
	SET ${colsToUpdate.join(', ')}
	WHERE id = $${paramIndex}
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [...values, id]);
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot insert author: ${err.message}`);
    }
};

export const removeAuthor_db = async (id) => {
    try {
        const { rows } = await pool.query(
            `
			DELETE FROM authors 
			WHERE id = $1
			RETURNING *`,
            [id],
        );
        return rows[0];
    } catch {
        throw new Error(`Failed to delete author id=${id}: ${err.message}`);
    }
};
