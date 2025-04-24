import pool from '../pool.cjs';

const categoriesFields = ['id', 'category'];

export const getAllCategories_db = async () => {
    try {
        const { rows } = await pool.query('SELECT * FROM categories');
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const getCategoryBy_db = async (param, value) => {
    if (!categoriesFields.includes(param)) {
        throw new Error(`Invalid query parameter '${param}'.`);
    }

    const comparison = param === 'id' ? 'id = $1' : `${param} ILIKE $1`;
    const query = `SELECT * FROM categories WHERE ${comparison}`;
    try {
        const { rows } = await pool.query(query, [value]);
        return rows;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    }
};

export const setCategory_db = async (category) => {
    try {
        const { rows } = await pool.query(
            `
			INSERT INTO categories (category)
			VALUES ($1)
			RETURNING *`,
            [category],
        );
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot insert category: ${err.message}`);
    }
};

export const updateCategory_db = async (categoryData) => {
    const { id, category } = categoryData;
    if (!id || !category) {
        throw new Error('Missing category data');
    }

    const query = `
	UPDATE categories 
	SET category = $1
	WHERE id = $2
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [category, id]);
        return rows[0];
    } catch (err) {
        throw new Error(`Cannot update category: ${err.message}`);
    }
};

export const removeCategory_db = async (id) => {
    try {
        const { rows } = await pool.query(
            `
			DELETE FROM categories
			WHERE id = $1
			RETURNING *`,
            [id],
        );
        return rows[0];
    } catch (err) {
        throw new Error(`Failed to delete category id=${id}: ${err.message}`);
    }
};
