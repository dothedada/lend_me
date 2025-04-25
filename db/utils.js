import { tables } from './query_settings';

/**
 * Checks if multiple elements exist in a table and returns their IDs
 * @param {string} table - Table name to check
 * @param {Array<string|number>} ids - Array of IDs to verify
 * @returns {Promise<Array<string|number>>} Array of existing IDs
 * @throws {Error} If table is invalid, IDs array is empty, or query fails
 */
export const elementExists = async (table, ids) => {
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
 * Checks if records match criteria in a database table.
 * @param {string} table - Valid table name from allowed list.
 * @param {Object} valuesObj - Search conditions (key: column, value: search term).
 * @returns {Promise<boolean>} True if matching records exist.
 * @throws {Error} If table is invalid or query fails.
 */
export const recordExists = async (table, valuesObj) => {
    if (!tables.includes(table)) {
        throw new Error(`'${table}' is not a valid table`);
    }

    const [keys, values] = Object.entries(valuesObj).reduce(
        (acc, [key, value], i) => {
            if (value === null || value === undefined) {
                return acc;
            }
            const comparison = isNaN(value) ? ' ILIKE ' : ' = ';
            acc[0].push(`${key} ${comparison} $${i + 1}`);
            acc[1].push(value);
            return acc;
        },
        [[], []],
    );

    const query = `
	SELECT EXISTS (
		SELECT 1 FROM ${table} WHERE ${keys.join(' AND ')}
	) AS exist`;

    try {
        const { rows } = await pool.query(query, values);
        return rows[0].exist;
    } catch (err) {
        throw new Error(`Database query on '${table}' failed: ${err.message}`);
    }
};
