import pool from '../pool.cjs';

const editorialsFields = ['id', 'name', 'url'];

export const getAllEditorials_db = async () => {
    try {
        const { rows } = await pool.query('SELECT * FROM editorials');
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const getEditorialBy_db = async (param, value) => {
    if (!editorialsFields.includes(param)) {
        throw new Error(`Invalid query parameter '${param}'.`);
    }

    const comparison = param === 'id' ? 'id = $1' : `${param} ILIKE $1`;
    const query = `SELECT * FROM editorials WHERE ${comparison}`;
    try {
        const { rows } = await pool.query(query, [value]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const setEditorial_db = async (name, url = '') => {
    try {
        const { rows } = await pool.query(
            `
			INSERT INTO editorials (name, url)
			VALUES ($1, $2)
			RETURNING *`,
            [name, url],
        );
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot insert editorial: ${err.message}`);
    }
};

export const updateEditorial_db = async (editorialData) => {
    const { id } = editorialData;
    if (!id) {
        throw new Error('Missing editorial id');
    }

    const colsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    for (const key of editorialsFields) {
        if (key === 'id' || editorialData[key] === undefined) {
            continue;
        }
        colsToUpdate.push(`${key}=$${paramIndex}`);
        values.push(editorialData[key]);
        paramIndex++;
    }

    const query = `
	UPDATE editorials 
	SET ${colsToUpdate.join(', ')}
	WHERE id = $${paramIndex}
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [...values, id]);
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot insert editorial: ${err.message}`);
    }
};

export const removeEditorial_db = async (id) => {
    try {
        const { rows } = await pool.query(
            `
			DELETE FROM editorials
			WHERE id = $1
			RETURNING *`,
            [id],
        );
        return rows[0];
    } catch (err) {
        throw new Error(`Failed to delete editorial id=${id}: ${err.message}`);
    }
};
