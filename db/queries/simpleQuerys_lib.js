import { tables, SEARCH_LIMIT } from '../query_settings.js';
import { validateId } from '../utils.js';

export const queryMethods = (
    client,
    table,
    methods = ['get', 'find', 'add', 'put', 'delete'],
) => {
    if (!Object.keys(tables).includes(table)) {
        throw new Error(`Wrong table name '${table}'.`);
    }

    if (!Array.isArray(methods)) {
        throw new Error('Methods parameter must be an array');
    }

    const requestedMethods = methods.reduce((requested, method) => {
        if (availableMethods[method]) {
            requested[method] = availableMethods[method](client, table);
        }
        return requested;
    }, {});

    if (Object.keys(requestedMethods).length === 0) {
        throw new Error(`No valid methods requested.`);
    }

    return requestedMethods;
};

const getDataFrom_db = (client, tableName) => {
    const validFields = tables[tableName];

    return async (valueObject) => {
        let query = `SELECT * FROM ${tableName}`;

        const values = [];

        if (valueObject && Object.keys(valueObject).length > 0) {
            const [field, value] = Object.entries(valueObject)[0];

            if (!validFields.includes(field)) {
                throw new Error(
                    `Table '${tableName}' does not contain column '${field}'`,
                );
            }

            query += isNaN(value)
                ? ` WHERE ${field} ILIKE $1`
                : ` WHERE ${field} = $1`;

            values.push(value);
        }

        try {
            const { rows } = await client.query(query, values);
            return valueObject ? rows[0] : rows;
        } catch (err) {
            throw new Error(`Database query failed: ${err.message}`);
        }
    };
};

const findDataWith_db = (client, tableName) => {
    const [, ...tableValues] = tables[tableName];

    return async (value) => {
        if (!value.trim()) {
            return [];
        }

        const comparison = [];
        for (const key of tableValues) {
            comparison.push(`${key}::text ILIKE $1`);
        }
        const query = `
		SELECT * FROM ${tableName} 
		WHERE ${comparison.join(' OR ')}
		LIMIT ${SEARCH_LIMIT}`;

        try {
            const { rows } = await client.query(query, [`%${value}%`]);
            return rows;
        } catch (err) {
            throw new Error(`Database query failed: ${err.message}`);
        }
    };
};

const insertDataTo_db = (client, tableName) => {
    const [, ...tableValues] = tables[tableName];

    return async (valuesObject) => {
        const presentValues = [];
        const queryValues = [];
        const cleanValues = [];
        let queryCounter = 1;

        for (const [key, value] of Object.entries(valuesObject)) {
            if (!tableValues.includes(key)) {
                continue;
            }

            presentValues.push(key);
            queryValues.push(`$${queryCounter}`);
            cleanValues.push(value);
            queryCounter++;
        }

        if (!tableValues.length) {
            throw new Error(`no value to update inside '${valuesObject}'`);
        }

        const query = `
		INSERT INTO ${tableName} (${presentValues.join(', ')})
		VALUES (${queryValues.join(', ')})
		RETURNING *`;

        try {
            const { rows } = await client.query(query, cleanValues);
            return rows[0];
        } catch (err) {
            throw new Error(`Cannot insert ${tableName}: ${err.message}`);
        }
    };
};

const updateDataFrom_db = (client, tableName) => {
    const [, ...tableValues] = tables[tableName];

    return async (valuesObject) => {
        const { id } = valuesObject;
        if (!id) {
            throw new Error(`Missing ${tableName} id in values to update`);
        }

        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        for (const key of tableValues) {
            if (valuesObject[key] === undefined) {
                continue;
            }
            fieldsToUpdate.push(`${key} = $${paramIndex}`);
            values.push(valuesObject[key]);
            paramIndex++;
        }

        values.push(id);

        const query = `
		UPDATE ${tableName} 
		SET ${fieldsToUpdate.join(', ')}
		WHERE id = $${paramIndex}
		RETURNING *`;

        try {
            const { rows } = await client.query(query, values);
            if (!rows.length) {
                throw new Error(
                    `The id '${id}' does not exist in '${tableName}'`,
                );
            }
            return rows[0];
        } catch (err) {
            throw new Error(`Cannot update ${tableName}: ${err.message}`);
        }
    };
};

const removeDataFrom_db = (client, table) => {
    return async (id) => {
        const cleanId = validateId(id);

        const query = `
		DELETE FROM ${table}
		WHERE id = $1
		RETURNING *`;

        try {
            const { rows } = await client.query(query, [cleanId]);
            if (!rows.length) {
                throw new Error(`The id '${id}' does not exist in '${table}'`);
            }
            return rows[0];
        } catch (err) {
            throw new Error(
                `Failed to delete ${table} id=${id}: ${err.message}`,
            );
        }
    };
};

const availableMethods = {
    get: getDataFrom_db,
    find: findDataWith_db,
    add: insertDataTo_db,
    put: updateDataFrom_db,
    remove: removeDataFrom_db,
};
