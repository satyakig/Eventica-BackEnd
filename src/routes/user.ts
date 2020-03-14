import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import * as lodash from 'lodash';
import { getUserFromRequest } from '../lib/AuthHelper';
import { DB_PATHS, updateDocument } from '../lib/DBHelper';
import { isMobile, sanitizeString } from '../lib/DataValidator';

const router = Router();

/**
 * Update user
 * Sample JSON PATCH
 {
    "name": "Satyaki Gho",
    "phone": "403111111",
    "photoURL": "https://w.wallhaven.cc/full/96/wallhaven-96w8e8.png"
 }
 */
router.patch(
  '/',
  asyncHandler(async (req, res, next) => {
    const user = await getUserFromRequest(req);

    const phone = sanitizeString(req.body.phone);
    const name = lodash.startCase(sanitizeString(req.body.name).toLowerCase());
    const photoURL = sanitizeString(req.body.photoURL);

    if (name.length < 1) {
      return next(httpErrors(400, 'Invalid name format.'));
    }

    if (!isMobile(phone)) {
      return next(httpErrors(400, 'Invalid phone format.'));
    }

    if (!photoURL.includes('https://')) {
      return next(httpErrors(400, 'Invalid photo url.'));
    }

    return updateDocument(DB_PATHS.USERS, user.uid, {
      name,
      photoURL,
      phone,
    })
      .then(() => {
        return res.status(200).send('Your account information has been updated.');
      })
      .catch((err) => {
        console.error(err);
        return next(httpErrors(500, err));
      });
  }),
);

export const userRoutes = router;
