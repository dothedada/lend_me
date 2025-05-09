//import { pick } from './utils.js';

export const SEARCH_LIMIT = 20;

export const tables = {
    authors: ['id', 'name', 'bio', 'url'],
    editorials: ['id', 'name', 'url'],
    categories: ['id', 'category'],
    books: [
        'id',
        'title',
        'author_id',
        'editorial_id',
        'year',
        'category_id',
        'sinopsys',
        'url',
        'image',
    ],
    users: ['id', 'name', 'email'],
    lends: [
        'id',
        'book_id',
        'owner_id',
        'to_id',
        'date_taken',
        'date_returned',
        'status',
    ],
    book_user: ['book_id', 'user_id'],
    friend_request: ['id', 'from_id', 'to_id', 'message'],
    friends: ['user_a', 'user_b'],
};

export const booksInventoryQuery = (uniqueQueryColumn) => `
	SELECT ${uniqueQueryColumn ? `DISTINCT ON (${uniqueQueryColumn})` : ''}
		books.id AS id,
		books.title AS title,
		books.author_id AS author_id,
		authors.name AS author,
		books.editorial_id AS editorial_id,
		editorials.name AS editorial,
		categories.category AS category,
		books.year AS year,
		books.sinopsys AS sinopsys,
		books.image AS photo,
		books.url AS url,
		users.name AS owner,
		book_user.user_id AS owner_id,
		lends.status AS status
	FROM book_user
	LEFT JOIN books ON book_user.book_id = books.id
	JOIN authors ON books.author_id = authors.id
	JOIN editorials ON books.editorial_id = editorials.id
	JOIN categories ON books.category_id = categories.id
	JOIN users ON users.id = book_user.user_id
	LEFT JOIN lends ON books.id = lends.book_id AND users.id = lends.owner_id`;

export const bookQueryColumns = {
    id: 'books.id',
    title: 'books.title',
    author_id: 'books.author_id',
    author: 'authors.name',
    editorial_id: 'books.editorial_id',
    editorial: 'editorials.name',
    category: 'categories.category',
    year: 'books.year',
    sinopsys: 'books.sinopsys',
    photo: 'books.image',
    url: 'books.url',
    owner: 'users.name',
    owner_id: 'book_user.user_id',
};

export const lendsQuery = `
SELECT 
	lends.id AS "lend_id",
	book.id AS "book_id",
	book.title AS "title",
	book.author AS "author",
	book.author_id AS "author_id",
	owner_user.name AS "owner_user",
	to_user.name AS "to_user",
	lends.owner_id AS "owner_user_id",
	lends.to_id AS "to_user_id",
	lends.status AS "status",
	lends.date_taken AS "date_taken",
	lends.date_returned AS "date_returned"
FROM lends
JOIN users AS to_user ON lends.to_id = to_user.id
JOIN users AS owner_user ON lends.owner_id = owner_user.id
JOIN (
	SELECT 
		books.id AS id,
		books.title AS title,
		books.author_id AS author_id,
		authors.name AS author
		FROM books
		JOIN authors ON books.author_id = authors.id
	) AS book ON lends.book_id = book.id`;

export const lendsQueryColumns = {
    lend_id: 'lends.id',
    book_id: 'book.id',
    title: 'book.title',
    author: 'book.author',
    author_id: 'book.author_id',
    owner_user: 'owner_user.name',
    to_user: 'to_user.name',
    owner_user_id: 'lends.owner_id',
    to_user_id: 'lends.to_id',
    status: 'lends.status',
    date_taken: 'lends.date_taken',
    date_returned: 'lends.date_returned',
};

/**
 * Creates a new object with only the specified properties picked from the source object.
 * @param {Object} obj - The source object from which to pick properties.
 * @param {Array<string>} keys - An array of property names to pick from the source object.
 */
export const pick = (obj, keys) =>
    keys.reduce((acc, current) => {
        if (!obj[current]) {
            return acc;
        }
        acc[current] = obj[current];
        return acc;
    }, {});

export const searchParams = [
    'title',
    'author',
    'editorial',
    'category',
    'year',
    'owner',
];

export const searchBookParams = pick(bookQueryColumns, searchParams);

export const lendStatus = ['requested', 'denied', 'active', 'returned'];
