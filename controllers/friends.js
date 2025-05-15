import { friends_db } from '../db/queries/friends.js';
import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';
import { asyncWrapper, setValidationResult } from './middleware.js';
import { CustomErr, errorMsg, friendRequestRules } from './validations.js';

export const getFriends = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const friendsId = await friends_db.getFriends(userId);
    const friends = await users_db.getUsersData(friendsId);

    res.friends = friends;

    next();
});

export const friendRequestValidation = [
    friendRequestRules,
    setValidationResult,
];

export const friendRequest = asyncWrapper(async (req, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    const friend = await recordExists('users', { name, email });
    await friends_db.makeRequest(userId, friend.id, message);

    next();
});

export const sendedRequests = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const requests = await friends_db.getRequests('from', userId);

    res.sendedRequests = requests;

    next();
});

export const receivedRequests = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const requests = await friends_db.getRequests('to', userId);
    res.receivedRequests = requests;

    next();
});

export const processRequest = async (req, _, next) => {
    const { requestId, fromId, toId, action } = req.body;
    if (!requestId || !fromId || !toId || !action) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await friends_db.cancelRequest(requestId);
    if (action !== 'deny') {
        await friends_db.addFriendship(fromId, toId);
    }

    next();
};

export const removeFriendship = async (req, _, next) => {
    const userId = req.user.id;
    if (!userId) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const { friendId } = req.body;
    if (!friendId) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await friends_db.removeFriendship(userId, friendId);

    next();
};
