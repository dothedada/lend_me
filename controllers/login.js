import { users_db } from '../db/queries/simpleQuerys.js';
import { recordExists } from '../db/utils.js';

export const checkUserLog = (req, res, next) => {
    const cookies = req.cookies;

    if (Object.keys(cookies).length === 0 || !cookies['lend_me_usr']) {
        return res.redirect('/login');
    }

    next();
};

export const logUser = async (req, res, next) => {
    const { name, email, keepLogged } = req.body;
    const user = await recordExists('users', { name, email });
    if (user) {
        res.sessionCookie = { make: true, value: user.id, keepLogged };
    } else {
        res.userFields = { name, email };
        res.sessionCookie = { make: false };
    }

    next();
};

export const createUser = async (req, res, next) => {
    const { name, email, keepLogged } = req.body;
    console.log('body create:', req.body);
    const newUser = await users_db.add({ name, email });

    res.sessionCookie =
        newUser !== undefined
            ? { make: true, value: newUser.id, keepLogged }
            : { make: false };

    next();
};

export const createSessionCookie = (_, res, next) => {
    if (!res.sessionCookie?.make) {
        next();
        return;
    }

    const { value, keepLogged } = res.sessionCookie;

    const now = new Date(Date.now());
    const expires =
        keepLogged === 'on'
            ? new Date(now.setMonth(now.getMonth() + 1))
            : new Date(Date.now() + 60000 * 5);

    res.cookie('lend_me_usr', value, { expires });

    next();
};
