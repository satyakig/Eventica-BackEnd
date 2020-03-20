import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest, getUserRecordByEmail } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { USER_EVENT_STATUS, validateHost } from '../lib/EventHelper';
import { sendNotification } from '../lib/NotificationHelper';
import { getEventData } from '../lib/UserEventHelper';

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
    const respTitle = 'Add User(s)';
    let respMessage = '';
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    let event: any;
    try {
      await validateHost(eid, user);
      event = await getEventData(eid);
    } catch (err) {
      respMessage = err;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    const emails = req.body.emails;
    if (!emails || emails.length < 1) {
      respMessage = 'At least one email address required.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
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

      sendNotification(
        userInfo,
        true,
        'Event Invite',
        `You have been invited to join ${event.name}.`,
      );

      newDocs++;
    }

    if (newDocs === 0) {
      respMessage = 'No users were added to the event. Please verify the attendee emails.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    respMessage = `${newDocs} users have been added to the event.`;
    sendNotification(user, true, respTitle, respMessage);
    return res.status(200).send(respMessage);
  }),
);

export const addUserRoutes = router;
