import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import * as lodash from 'lodash';
import { getUserFromRequest } from '../lib/AuthHelper';
import { DB_PATHS, updateDocument } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { sendNotification } from '../lib/NotificationHelper';

const router = Router();

function eventsHosted(user: any) {
  getDb()
    .collection(DB_PATHS.EVENTS)
    .where('createdBy.email', '==', user.email)
    .get()
    .then((snapshot) => {
      for (const doc of snapshot.docs) {
        updateDocument(DB_PATHS.EVENTS, doc.id, {
          createdBy: {
            email: user.email,
            name: user.name,
          },
        });
      }
    });
}

function commentsMade(user: any) {
  getDb()
    .collection(DB_PATHS.EVENT_COMMENTS)
    .where('createdBy.email', '==', user.email)
    .get()
    .then((snapshot) => {
      for (const doc of snapshot.docs) {
        updateDocument(DB_PATHS.EVENT_COMMENTS, doc.id, {
          createdBy: {
            email: user.email,
            name: user.name,
            profile: user.photoURL,
          },
        });
      }
    });
}

function eventUsers(user: any) {
  getDb()
    .collection(DB_PATHS.EVENT_USERS)
    .where('uid', '==', user.uid)
    .get()
    .then((snapshot) => {
      for (const doc of snapshot.docs) {
        updateDocument(DB_PATHS.EVENT_USERS, doc.id, {
          name: user.name,
          photoURL: user.photoURL,
        });
      }
    });
}

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
    const respTitle = 'Profile Update';
    let respMessage = '';

    const user = await getUserFromRequest(req);
    const name = lodash.startCase(sanitizeString(req.body.name).toLowerCase());
    const photoURL = sanitizeString(req.body.photoURL);

    if (name.length < 1) {
      respMessage = 'Invalid name provided.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (!photoURL.includes('https://')) {
      respMessage = 'Invalid photo url provided.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    user.name = name;
    user.photoURL = photoURL;

    eventsHosted(user);
    commentsMade(user);
    eventUsers(user);

    return updateDocument(DB_PATHS.USERS, user.uid, {
      name,
      photoURL,
    }).then(() => {
      respMessage = 'Your profile has been updated.';
      sendNotification(user, true, respTitle, respMessage);
      return res.status(200).send(respMessage);
    });
  }),
);

export const userRoutes = router;
