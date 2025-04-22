#! usr/bin/env node

const { Client } = require('pg');
const fs = require('fs/promises');

const parseFile = async (filename) => {
    let data;
    try {
        data = await fs.readFile(filename, 'utf-8');
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
    console.log('setting up the database...');
    client.connect();
    schema = parseFile('./schema.txt');
    client.query(schema);

    console.log('seeding the data...');
    seed = parseFile('./seed.txt');
    client.query(seed);
    client.end();

    console.log('done');
}

main();
