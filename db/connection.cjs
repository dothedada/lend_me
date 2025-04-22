require('dotenv').config();

const devSQL = {
    connectionString: process.env.CONNECTION_DEV,
};

const prdSQL = {
    connectionString: process.env.CONNECTION_PRD,
};

module.exports = { devSQL, prdSQL };
