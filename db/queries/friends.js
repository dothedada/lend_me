import { CustomErr, errorMsg } from '../../controllers/validations.js';
import pool from '../pool.cjs';
import { elementExists, recordExists, validateId } from '../utils.js';

const getAllFriends_db = async (userId) => {
    const cleanId = validateId(userId);
    await elementExists('users', [cleanId]);
    const query = `SELECT user_b FROM friends WHERE user_a = $1`;

    try {
        const { rows } = await pool.query(query, [cleanId]);
        return rows.map((e) => e.user_b);
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const checkFriendship_db = async (userId, friendId) => {
    return (
        (await recordExists('friends', {
            user_a: userId,
            user_b: friendId,
        })) !== undefined
    );
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
        throw new CustomErr(errorMsg.dbUserNotExist(userExist), 404);
    }
    if (friendExist.length === 0) {
        throw new CustomErr(errorMsg.dbUserNotExist(friendExist), 404);
    }
    if (friendshipExists) {
        throw new CustomErr(errorMsg.dbFriendship, 404);
    }

    const query = `SELECT add_friend($1, $2)`;

    try {
        await pool.query(query, values);
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const removeFriendship_db = async (userA, userB) => {
    const userA_clean = validateId(userA);
    const userB_clean = validateId(userB);

    if (!(await checkFriendship_db(userA_clean, userB_clean))) {
        throw new CustomErr(errorMsg.dbNoFriendship, 404);
    }

    const query = `
	SELECT remove_friend($1, $2)`;
    try {
        const { rows } = await pool.query(query, [userA_clean, userB_clean]);
        return rows;
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const removeUser_db = async (userId) => {
    const cleanUser = validateId(userId);

    const query = `
	DELETE FROM friends
	WHERE user_a = $1 OR user_b = $1
	RETURNING *`;

    try {
        const { rows } = await pool.query(query, [cleanUser]);
        return rows;
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const addRequest_db = async (from, to, message) => {
    if (!from || !to || !message) {
        throw new CustomErr(errorMsg.dbMissingParams, 404);
    }

    const query = `
	INSERT INTO friend_request (from_id, to_id, message)
	VALUES ($1, $2, $3)
	RETURNING *`;

    try {
        const { rows } = pool.query(query, [from, to, message]);
        return rows;
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const cancelReques_db = async (requestId) => {
    const id = validateId(requestId);

    const query = `
	DELETE FROM friend_request 
	WHERE id = $1
	RETURNING *`;

    try {
        const { rows } = pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
        );
    }
};

const getFriendRequests_db = async (fromOrTo, id) => {
    if (!fromOrTo || !id || isNaN(id)) {
        throw new CustomErr(errorMsg.dbMissingParams, 404);
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
        const { rows } = await pool.query(query, [id]);
        return rows;
    } catch (err) {
        throw new CustomErr(
            errorMsg.dbQuery('friends', err),
            500,
            'serverError',
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
