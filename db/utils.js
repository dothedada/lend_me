import { tables } from './query_settings';

/**
 * Checks if multiple elements exist in a table and returns their IDs
 * @param {string} table - Table name to check
 * @param {Array<string|number>} ids - Array of IDs to verify
 * @returns {Promise<Array<string|number>>} Array of existing IDs
 * @throws {Error} If table is invalid, IDs array is empty, or query fails
 */
export const elementInTable = async (table, ids) => {
    if (!tables.includes(table)) {
        throw new Error(`'${table}' is not a valid table`);
    }

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error(`'${ids}' needs to be a non empty array`);
    }

    const uniqueIds = [...new Set([...ids.filter((e) => e)])];

    if (uniqueIds.length === 0) {
        throw new Error('No valid IDs provided');
    }

    const idsPlaceHolders = uniqueIds.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
	SELECT * FROM ${table} 
	WHERE id IN (${idsPlaceHolders})
	`;

    try {
        const { rows } = await pool.query(query, uniqueIds);
        const exist = rows.map((row) => row.id);
        const missing = uniqueIds.filter((id) => !exist.includes(id));

        if (missing.length > 0) {
            console.warn(
                `[DB Warning] IDs not found in ${table}:`,
                missing.join(', '),
            );
        }

        return exist;
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
