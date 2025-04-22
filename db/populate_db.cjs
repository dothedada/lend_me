#! usr/bin/env node

const fs = require('fs/promises');
const { Client } = require('pg');
const path = require('path');

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
    require('dotenv').config();
    const client = new Client({
        connectionString: process.env.CONNECTION_STRING,
    });

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
