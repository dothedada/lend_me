import { Router } from 'express';

const friendsRoute = Router();

friendsRoute.get('/', (req, res) => {
    const user = req.user;
    // NOTE: Revisar la estructura de la tabla de friends,
    // que puede ser problematica (por lo del orden)
    res.render('friends.ejs', {
        user,
        friends: [],
        friendRequests: [],
        activeRequests: [],
    });
});

export default friendsRoute;
