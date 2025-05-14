import { friends_db } from '../db/queries/friends.js';
import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';
import { setValidationResult } from './middleware.js';
import { friendRequestRules } from './validations.js';

export const getFriends = async (req, res, next) => {
    const userId = req.user.id;

    const friendsId = await friends_db.getFriends(userId);
    const friends = await users_db.getUsersData(friendsId);

    res.friends = friends;

    next();
};

export const friendRequestValidation = [
    friendRequestRules,
    setValidationResult,
];

export const friendRequest = async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const userId = req.user.id;
    const { name, email, message } = req.body;
    const friend = await recordExists('users', { name, email });
    await friends_db.makeRequest(userId, friend.id, message);

    next();
};

export const sendedRequests = async (req, res, next) => {
    const userId = req.user.id;
    const requests = await friends_db.getRequests('from', userId);
    res.sendedRequests = requests;

    next();
};

export const receivedRequests = async (req, res, next) => {
    const userId = req.user.id;
    const requests = await friends_db.getRequests('to', userId);
    res.receivedRequests = requests;

    next();
};

export const processRequest = async (req, res, next) => {
    const { requestId, fromId, toId, action } = req.body;

    await friends_db.cancelRequest(requestId);
    if (action !== 'deny') {
        await friends_db.addFriendship(fromId, toId);
    }

    next();
};

export const removeFriendship = async (req, res, next) => {
    const userId = req.user.id;
    const { friendId } = req.body;

    await friends_db.removeFriendship(userId, friendId);

    next();
};
