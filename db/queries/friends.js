import pool from '../pool.cjs';
import { elementExists, recordExists, validateId } from '../utils.js';

const getAllFriends_db = async (userId) => {
    const cleanId = validateId(userId);

    const userExist = await elementExists('users', [cleanId]);
    if (userExist.length === 0) {
        throw new Error(`The user with the id '${cleanId}' does not exist`);
    }

    const query = `SELECT user_b FROM friends WHERE user_a = $1`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
        return rows.map((e) => e.user_b);
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

const checkFriendship_db = async (userId, friendId) => {
    return await recordExists('friends', {
        user_id: userId,
        friend_id: friendId,
    });
};

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

    const query = `SELECT add_friend($1, $2)`;

    try {
        await pool.query(query, values);
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

const removeFriendship_db = async (userA, userB) => {
    const userA_clean = validateId(userA);
    const userB_clean = validateId(userB);

    if (!(await checkFriendship_db(userA_clean, userB_clean))) {
        throw new Error('The users are not friends');
    }

    const query = `
	SELECT remove_friend($1, $2)`;
    try {
        const { rows } = await pool.query(query, [userA_clean, userB_clean]);
        return rows;
    } catch (err) {
        throw new Error(`Database query to 'friends' failed: ${err.message}`);
    }
};

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

const addRequest_db = async (from, to, message) => {
    if (!from || !to || !message) {
        throw new Error('Some paramaters are missing');
    }

    const query = `
	INSERT INTO friend_request (from_id, to_id, message)
	VALUES ($1, $2, $3)
	RETURNING *`;

    try {
        const { rows } = pool.query(query, [from, to, message]);
        return rows;
    } catch (err) {
        throw new Error(
            `Database query to 'friend_reques' failed: ${err.message}`,
        );
    }
};

const cancelReques_db = async (requestId) => {
    if (!requestId || isNaN(requestId)) {
        throw new Error(`Must provide a valid id: '${requestId}`);
    }

    const query = `
	DELETE FROM friend_request 
	WHERE id = $1
	RETURNING *`;

    try {
        const { rows } = pool.query(query, [requestId]);
        return rows;
    } catch (err) {
        throw new Error(
            `Database query to 'friend_reques' failed: ${err.message}`,
        );
    }
};

const getFriendRequests_db = async (fromOrTo, id) => {
    if (!fromOrTo || !id || isNaN(id)) {
        throw new Error(`Must provide a valid params, id: '${requestId}`);
    }

    const filter =
        fromOrTo === 'from' ? 'friend_request.from_id' : 'friend_request.to_id';

    const query = `
	SELECT
		friend_request.id AS id,
		friend_request.from_id AS from_id,
		users_a.name AS from_name,
		friend_request.to_id AS to_id,
		users_b.name AS to_name,
		friend_request.message AS message
	FROM friend_request
	JOIN users users_a ON friend_request.from_id = users_a.id
	JOIN users users_b ON friend_request.to_id = users_b.id
	WHERE ${filter} = $1`;

    try {
        const { rows } = pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new Error(
            `Database query to 'friend_reques' failed: ${err.message}`,
        );
    }
};

export const friends_db = {
    makeRequest: addRequest_db,
    cancelRequest: cancelReques_db,
    getRequests: getFriendRequests_db,
    getFriends: getAllFriends_db,
    friendship: checkFriendship_db,
    addFriendship: addFriend_db,
    removeFriendship: removeFriendship_db,
    purgeUser: removeUser_db,
};
