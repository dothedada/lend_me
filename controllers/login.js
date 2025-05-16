import jwt from 'jsonwebtoken';
import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';
import { bookUser_db } from '../db/queries/library.js';
import { lends_db } from '../db/queries/lends.js';
import { friends_db } from '../db/queries/friends.js';
import { CustomErr, errorMsg, loginRules } from './validations.js';
import { asyncWrapper, setValidationResult } from './middleware.js';

export const inputValidation = [loginRules, setValidationResult];

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

export const logType = asyncWrapper(async (_, res, next) => {
    if (res.errors !== undefined) {
        return next();
    }

    const { name, email, keepLogged } = res.cleanData;
    const user = await recordExists('users', { name, email });

    res.cookieData = {
        make: user !== undefined,
        data: user !== undefined ? user : { name, email },
        keepLogged: keepLogged === 'on',
    };

    next();
});

export const createUser = asyncWrapper(async (_, res, next) => {
    if (res.errors !== undefined || res.cookieData?.make) {
        return next();
    }

    const { name, email } = res.cleanData;

    if (await recordExists('users', { email })) {
        res.errors = res.errors || {};
        res.errors.email = res.errors.email || [];
        res.errors.email.push({ msg: errorMsg.emailTaken });
        return next();
    }

    const newUser = await users_db.add({ name, email });
    res.cookieData.make = true;
    res.cookieData.data = newUser;

    next();
});

export const createSessionCookie = (_, res, next) => {
    if (res.errors !== undefined || !res.cookieData?.make) {
        return next();
    }

    const { data, keepLogged } = res.cookieData;
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

export const removeSessionCookie = (_, res, next) => {
    res.clearCookie('lend_me_usr', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });

    next();
};

// modify user
export const updateUser = asyncWrapper(async (req, res, next) => {
    const id = req.user.id;
    if (!id) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserId');
    }

    const { name, email } = req.body;
    if (!name || !email) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    await users_db.put({ id, name, email });

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
});

export const deleteUser = asyncWrapper(async (req, _, next) => {
    const user = req.user;
    if (!user) {
        throw new CustomErr(errorMsg.missingParams, 404, 'missingUserData');
    }

    const { confirmation } = req.body;
    if (!confirmation) {
        throw new CustomErr(errorMsg.missingBody, 404, 'missingRequestBody');
    }

    if (`${user.email}!666` !== confirmation) {
        return next();
    }

    await lends_db.returnAllLends(user.id);
    await bookUser_db.removeUser(user.id);
    await friends_db.purgeUser(user.id);
    await users_db.kill(user.id);

    next();
});
