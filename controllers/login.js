import jwt from 'jsonwebtoken';
import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';

export const checkUserLog = (req, res, next) => {
    const token = req.cookies.lend_me_usr;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_STR, (err, decoded) => {
        if (err) {
            res.clearCookie('lend_me_usr');
            res.status(403).redirect('/login');
        }

        req.user = { ...decoded, id: `${decoded.id}` };
    });

    next();
};

export const logUser = async (req, res, next) => {
    const { name, email, keepLogged } = req.body;
    const user = await recordExists('users', { name, email });

    if (!user) {
        res.userFields = { name, email };
        res.sessionCookie = { make: false };
        return next();
    }

    res.sessionCookie = {
        make: true,
        data: user,
        keepLogged: keepLogged === 'on',
    };

    next();
};

export const createUser = async (req, res, next) => {
    const { name, email, keepLogged } = req.body;
    const newUser = await users_db.add({ name, email });

    res.sessionCookie =
        newUser !== undefined
            ? { make: true, data: newUser, keepLogged }
            : { make: false };

    next();
};

export const createSessionCookie = (_, res, next) => {
    if (!res.sessionCookie?.make) {
        return next();
    }

    const { data, keepLogged } = res.sessionCookie;
    const { id, name, email } = data;

    // prettier-ignore
    const token = jwt.sign(
    	{ id, name, email },
    	process.env.JWT_STR,
    	{ expiresIn: keepLogged ? '30d' : '5m' }, 
    );

    res.cookie('lend_me_usr', token, {
        maxAge: keepLogged ? 30 * 24 * 3600 * 1000 : 5 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    next();
};

export const updateUser = async (req, res, next) => {
    const id = req.user.id;
    const { name, email } = req.body;

    users_db.put({ id, name, email });

    // prettier-ignore
    const token = jwt.sign(
    	{ id, name, email },
    	process.env.JWT_STR,
    	{ expiresIn: '30d' }, 
    );

    res.cookie('lend_me_usr', token, {
        maxAge: 30 * 24 * 3600 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    next();
};

export const deleteUser = async (req, res, next) => {
    const user = req.user;
    const { confirmation } = req.body;

    if (user.email !== confirmation) {
        return next();
    }

    next();
};
