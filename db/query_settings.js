export const SEARCH_LIMIT = 20;

export const fieldsFrom = {
    authors: ['id', 'name', 'bio', 'url'],
    editorials: ['id', 'name', 'url'],
    categories: ['id', 'category'],
    users: ['id', 'name', 'email'],
};

export const tables = [
    'books',
    'book_user',
    'authors',
    'editorials',
    'categories',
    'users',
    'lends',
];
