import { tables } from './query_settings';

/**
 * Verifies if an element exists in a specified table
 * @param {string} table - Table name to check
 * @param {number|string} id - Element ID to verify
 * @returns {Promise<boolean>} True if the element exists, false otherwise
 * @throws {Error} If table is invalid or database query fails
 */
export const elementInTable = async (table, id) => {
    if (!tables.includes(table)) {
        throw new Error(`'${table}' is not a valid table`);
    }
    const query = `
	SELECT EXISTS (
		SELECT 1 FROM ${table} WHERE id = $1
	) AS element_exists`;
    try {
        const { rows } = await pool.query(query, [id]);
        return rows[0].element_exists;
    } catch (err) {
        throw new Error(`Database query on '${table}' failed: ${err.message}`);
    }
};

/**
 * Checks if a record with the specified key-value pairs already exists
 * @param {string} table - Table name to check
 * @param {string} key1 - First column name
 * @param {any} value1 - First value to match
 * @param {string} key2 - Second column name
 * @param {any} value2 - Second value to match
 * @returns {Promise<boolean>} True if record exists, false otherwise
 * @throws {Error} If table is invalid or database query fails
 */
export const alreadyExist = async (table, key1, value1, key2, value2) => {
    if (!tables.includes(table)) {
        throw new Error(`'${table}' is not a valid table`);
    }

    const query = `
	SELECT EXISTS (
		SELECT 1 FROM ${table} WHERE ${key1} = $1 AND ${key2} = $2
	) AS already_exist`;

    try {
        const { rows } = await pool.query(query, [value1, value2]);
        return rows[0].already_exist;
    } catch (err) {
        throw new Error(`Database query on '${table}' failed: ${err.message}`);
    }
};
