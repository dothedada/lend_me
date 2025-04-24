/**
 * Factory function that creates requested query methods for a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name (must exist in fieldsFrom)
 * @param {Array<string>} [methods=['get', 'find', 'add', 'put', 'delete']] - Array of methods to create
 * @returns {object} An object with the requested methods
 * @throws {Error} If no valid methods are provided, table doesn't exist, or invalid method names
 */
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

const availableMethods = {
    get: getDataFrom_db,
    find: findDataWith_db,
    add: insertDataTo_db,
    put: updateDataFrom_db,
    remove: removeDataFrom_db,
};

const fieldsFrom = {
    authors: ['id', 'name', 'bio', 'url'],
    editorials: ['id', 'name', 'url'],
    categories: ['id', 'category'],
    users: ['id', 'name', 'email'],
};

/**
 * Creates a function to retrieve data from a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name
 * @returns {function} Async function that gets data
 */
const getDataFrom_db = (client, table) => {
    /**
     * Gets data from the table
     * @param {number|string} [id] - Optional ID to get specific record
     * @returns {Promise<Array<object>>} Array of records (or single record if ID provided)
     */
    return async (id) => {
        let query = `SELECT * FROM ${table}`;
        const values = [];
        if (id) {
            query += ` WHERE id = $1`;
            values.push(id);
        }

        try {
            const { rows } = await client.query(query, values);
            return rows;
        } catch (err) {
            throw new Error(`Database query failed: ${err.message}`);
        }
    };
};

/**
 * Creates a function to search data in a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name
 * @returns {function} Async search function
 */
const findDataWith_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    /**
     * Searches records where any column matches the search value
     * @param {string} value - Search term
     * @returns {Promise<Array<object>>} Array of matching records (max 20)
     */
    return async (value) => {
        if (!value.trim()) {
            return [];
        }

        const comparison = [];
        for (const key of tableValues) {
            comparison.push(`${key} ILIKE $1`);
        }
        const query = `
		SELECT * FROM ${table} 
		WHERE ${comparison.join(' OR ')}
		LIMIT 20`;

        try {
            const { rows } = await client.query(query, [`%${value}%`]);
            return rows;
        } catch (err) {
            throw new Error(`Database query failed: ${err.message}`);
        }
    };
};

/**
 * Creates a function to insert data into a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name
 * @returns {function} Async insert function
 */
const insertDataTo_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    /**
     * Inserts a new record into the table
     * @param {object} values - Object with field values to insert
     * @throws {Error} If any required field is missing
     * @returns {Promise<object>} The inserted record
     */
    return async (values) => {
        for (const key of tableValues) {
            if (values[key] === undefined) {
                throw new Error(`Missing '${key}' in values object.`);
            }
        }

        const queryValues = [];
        const cleanValues = [];
        let queryCounter = 1;

        for (const key of tableValues) {
            queryValues.push(`$${queryCounter}`);
            cleanValues.push(values[key]);
            queryCounter++;
        }

        const query = `
		INSERT INTO ${table} (${tableValues.join(', ')})
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

/**
 * Creates a function to update data in a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name
 * @returns {function} Async update function
 */
const updateDataFrom_db = (client, table) => {
    const [, ...tableValues] = fieldsFrom[table];

    /**
     * Updates an existing record
     * @param {object} valuesToUpdate - Object with ID and fields to update
     * @throws {Error} If ID is missing or record doesn't exist
     * @returns {Promise<object>} The updated record
     */
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
            fieldsToUpdate.push(`${key}=$${paramIndex}`);
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

/**
 * Creates a function to delete data from a table
 * @param {object} client - PostgreSQL client instance
 * @param {string} table - Table name
 * @returns {function} Async delete function
 */
const removeDataFrom_db = (client, table) => {
    /**
     * Deletes a record from the table
     * @param {number|string} id - ID of the record to delete
     * @throws {Error} If ID is invalid or record doesn't exist
     * @returns {Promise<object>} The deleted record
     */
    return async (id) => {
        if (!id) {
            throw new Error(`'${id}' is not a valid id`);
        }

        const query = `
		DELETE FROM ${table}
		WHERE id = $1
		RETURNING *`;

        try {
            const { rows } = await client.query(query, [id]);
            if (!rows.length) {
                throw new Error(`The id '${id}' does not exist in '${table}'`);
            }
            return rows[0];
        } catch (err) {
            throw new Error(`Failed to delete author id=${id}: ${err.message}`);
        }
    };
};

/**
 * Validates that a table exists in the fieldsFrom configuration
 * @param {string} table - Table name to check
 * @throws {Error} If table doesn't exist in configuration
 * @returns {boolean} True if table exists
 */
const checkTableExist = (table) => {
    if (!Object.keys(fieldsFrom).includes(table)) {
        throw new Error(`Wrong table name '${table}'.`);
    }
    return true;
};
