const { Pool } = require('pg');
const { devSQL, prdSQL } = require('./connection.cjs');

module.exports = new Pool(process.env.MODE === 'dev' ? devSQL : prdSQL);
