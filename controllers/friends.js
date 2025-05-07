import { friends_db } from '../db/queries/friends.js';

export const getFriends = async (req, res, next) => {
    const userId = req.user.id;

    const friends = await friends_db.getFriends(userId);
    res.friends = friends;

    next();
};
