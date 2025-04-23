import newPool from './pool.cjs';

export const getAllBooks_db = async () => {
    const { rows } = await newPool.query('SELECT * FROM books');
    return rows;
};
