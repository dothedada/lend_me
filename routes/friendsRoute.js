import { Router } from 'express';
import { getFriends } from '../controllers/friends.js';

const friendsRoute = Router();

friendsRoute.get('/', getFriends, (req, res) => {
    const user = req.user;
    res.render('friends.ejs', {
        user,
        friends: res.friends,
        friendRequests: [],
        activeRequests: [],
    });
});

export default friendsRoute;
