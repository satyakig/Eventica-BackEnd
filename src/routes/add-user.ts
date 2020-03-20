import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest, getUserRecordByEmail } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { USER_EVENT_STATUS } from '../lib/EventHelper';

const router = Router();

/**
 * Add Users
 * Sample JSON POST
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "emails": ["", ""]
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = sanitizeString(req.body.eid);

    if (!eid) {
      return next(httpErrors(400, 'Invalid event id provided.'));
    }

    try {
      const user = await getUserFromRequest(req);
      const eventUser = await getDb()
        .collection(DB_PATHS.EVENT_USERS)
        .where('eid', '==', eid)
        .where('uid', '==', user.uid)
        .where('status', '==', USER_EVENT_STATUS.HOST)
        .get();

      if (eventUser.docs.length !== 1) {
        return next(httpErrors(400, 'User does not have privileges to modify this event.'));
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    const emails = req.body.emails;

    if (!emails || emails.length < 1) {
      return next(httpErrors(400, 'At least one email address required.'));
    }

    const newDocs: any[] = [];

    try {
      /* eslint-disable no-await-in-loop */
      for (const email of emails) {
        const userInfo = await getUserRecordByEmail(email);

        const evUser = await getDb()
          .collection(DB_PATHS.EVENT_USERS)
          .where('eid', '==', eid)
          .where('uid', '==', userInfo.uid)
          .get();

        if (evUser.docs.length !== 0) {
          continue;
        }

        const addDoc = addToCollection(DB_PATHS.EVENT_USERS, {
          eid,
          status: USER_EVENT_STATUS.INVITED,
          uid: userInfo.uid,
        });

        newDocs.push(addDoc);
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    if (newDocs.length === 0) {
      return next(httpErrors(400, 'No users were added to the event. Please check your inputs.'));
    }

    return Promise.all(newDocs)
      .then(() => {
        return res.status(200).send(`${newDocs.length} users were added to the event.`);
      })
      .catch((err) => {
        return next(httpErrors(500, err));
      });
  }),
);

export const addUserRoutes = router;
