import pool from '../pool.cjs';
import { queryMethods } from './simpleQuerys_lib.js';

export const authors_db = queryMethods(pool, 'authors');
export const editorials_db = queryMethods(pool, 'editorials');
export const categories_db = queryMethods(pool, 'categories');
export const users_db = queryMethods(pool, 'users');
