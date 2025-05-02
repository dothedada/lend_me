import pool from '../pool.cjs';
import { elementExists, recordExists, validateId } from '../utils.js';

/**
 * Retrieves all friends of a user.
 * @param {string} userId - Valid user ID.
 * @returns {Promise<Array<Object>>} Array of friend records.
 * @throws {Error} If user doesn't exist or query fails.
 */
const getAllFriends_db = async (userId) => {
    const cleanId = validateId(userId);

    const userExist = await elementExists('users', [cleanId]);
    if (userExist.length === 0) {
        throw new Error(`The user with the id '${cleanId}' does not exist`);
    }

    const query = `SELECT friend_id FROM friends WHERE user_id = $1`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
        return rows.map((e) => e.friend_id);
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

/**
 * Checks if a friendship exists between two users.
 * @param {string} userId - First user ID.
 * @param {string} friendId - Second user ID.
 * @returns {Promise<boolean>} True if friendship exists.
 */
const checkFriendship_db = async (userId, friendId) => {
    return await recordExists('friends', {
        user_id: userId,
        friend_id: friendId,
    });
};

/**
 * Creates a friendship between two users.
 * @param {string} userId - First user ID.
 * @param {string} friendId - Second user ID.
 * @returns {Promise<Object>} Created friendship record.
 * @throws {Error} If users don't exist, are the same, or friendship exists.
 */
const addFriend_db = async (userId, friendId) => {
    const cleanUser = validateId(userId);
    const cleanFriend = validateId(friendId);
    const values =
        +cleanUser < +cleanFriend
            ? [cleanUser, cleanFriend]
            : [cleanFriend, cleanUser];

    if (values[0] === values[1]) {
        throw new Error('A user cannot be friend of himself');
    }

    const [userExist, friendExist, friendshipExists] = await Promise.all([
        elementExists('users', [cleanUser]),
        elementExists('users', [cleanFriend]),
        checkFriendship_db(values[0], values[1]),
    ]);

    if (userExist.length === 0) {
        throw new Error(`The user with the id '${userId}' does not exist`);
    }
    if (friendExist.length === 0) {
        throw new Error(`The user with the id '${friendId}' does not exist`);
    }
    if (friendshipExists) {
        throw new Error('Friendship already exists');
    }

    const query = `
	INSERT INTO friends (user_id, friend_id)
	VALUES ($1, $2)
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, values);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

/**
 * Removes a friendship between two users.
 * @param {string} userId - First user ID.
 * @param {string} friendId - Second user ID.
 * @returns {Promise<Object>} Deleted friendship record.
 * @throws {Error} If users aren't friends or query fails.
 */
const removeFriendship_db = async (userId, friendId) => {
    const cleanUser = validateId(userId);
    const cleanFriend = validateId(friendId);

    const values =
        +cleanUser < +cleanFriend
            ? [cleanUser, cleanFriend]
            : [cleanFriend, cleanUser];

    if (!(await checkFriendship_db(values[0], values[1]))) {
        throw new Error('The users are not friends');
    }

    const query = `
	DELETE FROM friends
	WHERE user_id = $1 AND friend_id = $2
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, values);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

/**
 * Removes all friendships of a user.
 * @param {string} userId - User ID to remove.
 * @returns {Promise<Array<Object>>} Deleted friendship records.
 * @throws {Error} If user ID is invalid or query fails.
 */
const removeUser_db = async (userId) => {
    const cleanUser = validateId(userId);

    const query = `
	DELETE FROM friends
	WHERE user_id = $1 OR friend_id = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanUser]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

export const friends_db = {
    getFriends: getAllFriends_db,
    friendship: checkFriendship_db,
    addFriendship: addFriend_db,
    removeFriendship: removeFriendship_db,
    purgeUser: removeUser_db,
};
