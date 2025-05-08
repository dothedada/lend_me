import { tables } from './query_settings.js';
import pool from './pool.cjs';

/**
 * Creates a new object with only the specified properties picked from the source object.
 * @param {Object} obj - The source object from which to pick properties.
 * @param {Array<string>} keys - An array of property names to pick from the source object.
 */
export const pick = (obj, keys) =>
    keys.reduce((acc, current) => {
        if (!obj[current]) {
            return acc;
        }
        acc[current] = obj[current];
        return acc;
    }, {});

export const validateId = (id) => {
    const cleanId = id.trim();
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
