import { fieldsFrom, SEARCH_LIMIT } from '../query_settings.js';
import { validateId } from '../utils.js';

export const queryMethods = (
    client,
    table,
    methods = ['get', 'find', 'add', 'put', 'delete'],
) => {
    checkTableExist(table);
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

const getDataFrom_db = (client, table) => {
    const validFields = fieldsFrom[table];

    return async (valueObject) => {
        let query = `SELECT * FROM ${table}`;

        const values = [];

        if (valueObject && Object.keys(valueObject).length > 0) {
            const [field, value] = Object.entries(valueObject)[0];

            if (!validFields.includes(field)) {
                throw new Error(
                    `Table '${table}' does not contain column '${field}'`,
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

const findDataWith_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    return async (value) => {
        if (!value.trim()) {
            return [];
        }

        const comparison = [];
        for (const key of tableValues) {
            comparison.push(`${key}::text ILIKE $1`);
        }
        const query = `
		SELECT * FROM ${table} 
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

const insertDataTo_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    return async (values) => {
        const presentValues = [];
        const queryValues = [];
        const cleanValues = [];
        let queryCounter = 1;

        for (const [key, value] of Object.entries(values)) {
            if (!tableValues.includes(key)) {
                continue;
            }

            presentValues.push(key);
            queryValues.push(`$${queryCounter}`);
            cleanValues.push(value);
            queryCounter++;
        }

        if (!tableValues.length) {
            throw new Error(`no value to update inside '${values}'`);
        }

        const query = `
		INSERT INTO ${table} (${presentValues.join(', ')})
		VALUES (${queryValues.join(', ')})
		RETURNING *`;

        try {
            const { rows } = await client.query(query, cleanValues);
            return rows[0];
        } catch (err) {
            throw new Error(`Cannot insert ${table}: ${err.message}`);
        }
    };
};

const updateDataFrom_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    return async (valuesToUpdate) => {
        const { id } = valuesToUpdate;
        if (!id) {
            throw new Error(`Missing ${table} id in values to update`);
        }

        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        for (const key of tableValues) {
            if (valuesToUpdate[key] === undefined) {
                continue;
            }
            fieldsToUpdate.push(`${key} = $${paramIndex}`);
            values.push(valuesToUpdate[key]);
            paramIndex++;
        }

        values.push(id);

        const query = `
		UPDATE ${table} 
		SET ${fieldsToUpdate.join(', ')}
		WHERE id = $${paramIndex}
		RETURNING *`;

        try {
            const { rows } = await client.query(query, values);
            if (!rows.length) {
                throw new Error(`The id '${id}' does not exist in '${table}'`);
            }
            return rows[0];
        } catch (err) {
            throw new Error(`Cannot update ${table}: ${err.message}`);
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

const checkTableExist = (table) => {
    if (!Object.keys(fieldsFrom).includes(table)) {
        throw new Error(`Wrong table name '${table}'.`);
    }
    return true;
};

const availableMethods = {
    get: getDataFrom_db,
    find: findDataWith_db,
    add: insertDataTo_db,
    put: updateDataFrom_db,
    remove: removeDataFrom_db,
};
