import { tables } from './query_settings.js';
import pool from './pool.cjs';

/**
 * Checks and validates a string to pass as an id
 * @param {string} id - The string that is needed to validate and clean
 * @returns {number} - the id number
 * @throws {Error} If no valid id input
 */
export const validateId = (id) => {
    const cleanId = `${id}`.trim();
    if (cleanId === '' || isNaN(cleanId)) {
        throw new Error(`'${id}' is not a valid user_id`);
    }
    return +cleanId;
};

export const elementExists = async (table, ids) => {
    if (!Object.keys(tables).includes(table)) {
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

export const recordExists = async (table, valuesObj) => {
    if (!Object.keys(tables).includes(table)) {
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

    const query = `SELECT * FROM ${table} WHERE ${keys.join(' AND ')} LIMIT 1`;

    try {
        const { rows } = await pool.query(query, values);
        return rows.length === 0 ? undefined : rows[0];
    } catch (err) {
        throw new Error(`Database query on '${table}' failed: ${err.message}`);
    }
};

/**
 * Creates SQL query parameter references from multiple arrays of values.
 * Flattens all input arrays, filters out empty values, and generates
 * parameter references ($1, $2, etc.) for SQL queries.
 *
 * @param {...Array} arrays - One or more arrays containing values to be used in SQL queries
 * @returns {Object} An object containing:
 *   - references {Array<string>} - Array of parameter references (e.g., ['$1', '$2'])
 *   - values {Array} - Array of non-empty values from input arrays
 *   - referenceCounter {number} - The next available parameter index
 * @throws {Error} If no valid values are found in input arrays
 */
export const createQueryArrayReferences = (...arrays) => {
    const flatArrays = arrays.flat();
    const values = [];
    const references = [];
    let referenceCounter = 1;

    for (const value of flatArrays) {
        const cleanValue = `${value}`.trim();
        if (!cleanValue) {
            continue;
        }

        values.push(value);
        references.push(`$${referenceCounter++}`);
    }

    if (values.length === 0) {
        throw new Error(
            "There are no valid values in 'arrays' to create the query refs.",
        );
    }

    return { references, values, referenceCounter };
};

/**
 * Creates SQL query parameter references from an object's key-value pairs,
 * filtered by specified keys. Generates parameter references ($1, $2, etc.)
 * for SQL queries.
 *
 * @param {Object} obj - The source object containing key-value pairs
 * @param {Array<string>} keyRefs - Array of keys to include from the object
 * @returns {Object} An object containing:
 *   - references {Array<string>} - Array of parameter references (e.g., ['$1', '$2'])
 *   - keys {Array<string>} - Array of keys from the object that were included
 *   - values {Array} - Array of values corresponding to the included keys
 *   - referenceCounter {number} - The next available parameter index
 * @throws {Error} If no valid key-value pairs are found
 */
export const createQueryKeyValueReferences = (obj, keyRefs) => {
    const keys = [];
    const values = [];
    const references = [];
    let referenceCounter = 1;

    for (const [key, value] of Object.entries(obj)) {
        if (!keyRefs.includes(key) || !`${value}`.trim()) {
            continue;
        }

        keys.push(key);
        values.push(value);
        references.push(`$${referenceCounter++}`);
    }

    if (values.length === 0 || keys.length === 0) {
        throw new Error(
            'There are no valid values in "obj" to create the query refs.',
        );
    }

    return { references, keys, values, referenceCounter };
};
