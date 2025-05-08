import { Router } from 'express';
import { friendRequest, getFriends } from '../controllers/friends.js';

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

friendsRoute.post('/add', friendRequest, (req, res) => {
    const { ok, message } = res.friendRequest;
    if (!ok) {
        res.send(`paila, '${message}'`);
        return;
    }
    res.redirect('/friends');
});

export default friendsRoute;
