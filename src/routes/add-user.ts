import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest, getUserRecordByEmail } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { USER_EVENT_STATUS, validateHost } from '../lib/EventHelper';

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
    const user = await getUserFromRequest(req);

    try {
      await validateHost(eid, user);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    const emails = req.body.emails;
    if (!emails || emails.length < 1) {
      return next(httpErrors(400, 'At least one email address required.'));
    }

    let newDocs = 0;

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

      addToCollection(DB_PATHS.EVENT_USERS, {
        eid,
        status: USER_EVENT_STATUS.INVITED,
        uid: userInfo.uid,
        name: userInfo.name,
        photoURL: userInfo.photoURL,
      });

      newDocs++;
    }

    if (newDocs === 0) {
      return next(httpErrors(400, 'No users were added to the event. Please check your inputs.'));
    }

    return res.status(200).send(`${newDocs} users have been added to the event.`);
  }),
);

export const addUserRoutes = router;
