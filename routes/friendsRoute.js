import { Router } from 'express';
import {
    friendRequest,
    getFriends,
    sendedRequests,
    receivedRequests,
    removeFriendship,
    processRequest,
    friendRequestValidation,
} from '../controllers/friends.js';

const friendsRoute = Router();
const friendsData = [getFriends, sendedRequests, receivedRequests];

friendsRoute.get('/', friendsData, (req, res) => {
    const user = req.user;
    res.render('friends.ejs', {
        user,
        friends: res.friends,
        receivedRequests: res.receivedRequests,
        sendedRequests: res.sendedRequests,
    });
});

friendsRoute.post(
    '/add',
    friendRequestValidation,
    friendRequest,
    friendsData,
    (req, res) => {
        if (res.errors !== undefined) {
            const user = req.user;
            const userInput = req.body;
            res.render('friends.ejs', {
                user,
                ...userInput,
                friends: res.friends,
                receivedRequests: res.receivedRequests,
                sendedRequests: res.sendedRequests,
                errors: res.errors,
            });

            return;
        }
        res.redirect('/friends');
    },
);

friendsRoute.post('/:requestId/request', processRequest, (req, res) => {
    res.redirect('/friends');
});

friendsRoute.post('/:friendId/remove', removeFriendship, (req, res) => {
    res.redirect('/friends');
});

export default friendsRoute;
