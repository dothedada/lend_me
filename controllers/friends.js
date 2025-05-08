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
    const { id: friendId } = recordExists({ name, email });

    if (!friendId) {
        throw new Error(
            `No record found with user '${name}' and mail '${email}'`,
        );
    }
    if (friends_db.friendship(userId, friendId)) {
        throw new Error(`'${req.user.name}' and '${name}' are already friends`);
    }

    await friends_db.makeRequest(userId, friendId, message);
};
