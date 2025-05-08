import { friends_db } from '../db/queries/friends.js';
import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';

export const getFriends = async (req, res, next) => {
    const userId = req.user.id;

    const friendsId = await friends_db.getFriends(userId);
    const friends = await users_db.getUsersData(friendsId);
    res.friends = friends;

    next();
};

export const friendRequest = async (req, res, next) => {
    const userId = req.user.id;
    const { name, email, message } = req.body;
    const friend = await recordExists('users', { name, email });

    if (!friend) {
        res.friendRequest = {
            ok: false,
            message: `No record found with user '${name}' and mail '${email}'`,
        };
        return next();
    }
    if (await friends_db.friendship(userId, friend.id)) {
        res.friendRequest = {
            ok: false,
            message: `'${req.user.name}' and '${name}' are already friends`,
        };
        return next();
    }

    const response = await friends_db.makeRequest(userId, friend.id, message);
    res.friendRequest = { ok: true, message: response };

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

export const cancelRequest = async (req, res, next) => {
    const { requestId } = req.body;
    await friends_db.cancelRequest(requestId);

    next();
};

export const acceptRequest = async (req, res, next) => {
    const { requestId, fromId, toId } = req.body;

    if (!requestId || !fromId || !toId) {
        throw new Error('Missing parameters to accept request');
    }

    await friends_db.cancelRequest(requestId);
    await friends_db.addFriendship(fromId, toId);

    next();
};
