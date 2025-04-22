#! usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');
const { devSQL, prdSQL } = require('./connection');

const parseFile = async (filename) => {
    let data;
    try {
        data = await fs.readFile(path.join(__dirname, filename), 'utf-8');
    } catch (err) {
        throw new Error(`Cannot load the file '${filename}'`);
    }
    return data;
};

async function main() {
    const client = new Client(process.env.MODE === 'dev' ? devSQL : prdSQL);

    try {
        console.log('Connecting to the server...');
        await client.connect();

        console.log('setting up the database...');
        const schema = await parseFile('./schema.txt');
        await client.query(schema);

        console.log('seeding the data...');
        const seed = await parseFile('./seed.txt');
        await client.query(seed);

        console.log('done');
    } catch (err) {
        console.error('Cannot seed the server:', err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
