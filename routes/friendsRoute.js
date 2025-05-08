import { Router } from 'express';
import {
    cancelRequest,
    friendRequest,
    getFriends,
    sendedRequests,
    receivedRequests,
    acceptRequest,
    removeFriendship,
} from '../controllers/friends.js';

const friendsRoute = Router();

friendsRoute.get(
    '/',
    getFriends,
    sendedRequests,
    receivedRequests,
    (req, res) => {
        const user = req.user;
        res.render('friends.ejs', {
            user,
            friends: res.friends,
            receivedRequests: res.receivedRequests,
            sendedRequests: res.sendedRequests,
        });
    },
);

friendsRoute.post('/add', friendRequest, (req, res) => {
    const { ok, message } = res.friendRequest;
    if (!ok) {
        res.send(`paila, '${message}'`);
        return;
    }
    res.redirect('/friends');
});

friendsRoute.post('/:requestId/cancel', cancelRequest, (req, res) => {
    res.redirect('/friends');
});

friendsRoute.post('/:requestId/accept', acceptRequest, (req, res) => {
    res.redirect('/friends');
});

friendsRoute.post('/:friendId/remove', removeFriendship, (req, res) => {
    res.redirect('/friends');
});

export default friendsRoute;
