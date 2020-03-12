import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS, updateDocument } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { EVENT_STATUS } from '../lib/EventHelper';

const router = Router();

/**
 * Update event users
 * Sample JSON POST
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "uid": "42fdsGW3teCAwwoJkMQQ"
    "status": (0, 1, 2) 0 = Yes, 1 = No, 2 = Maybe
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const user = await getUserFromRequest(req);
    const eid = sanitizeString(req.body.eid);
    const status = sanitizeString(req.body.status);

    // Get Event from the DB
    let event: any;
    try {
      event = await getDb()
        .collection(DB_PATHS.EVENTS)
        .where('eid', '==', eid)
        .get();
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    // Check if event was found
    if (event.docs.length !== 1) {
      return next(httpErrors(400, 'Event could not be found.'));
    }

    // Check if event is active
    if (event.docs[0].data()['status'] !== EVENT_STATUS.ACTIVE) {
      return next(httpErrors(400, 'Event is currently not active.'));
    }

    // Find eventUser element if it exists
    let eventUser: any;
    try {
      eventUser = await getDb()
        .collection(DB_PATHS.EVENT_USERS)
        .where('eid', '==', eid)
        .where('uid', '==', user)
        .get();
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    // Create or update eventUser element
    try {
      // If the user already has an entry
      if (eventUser.docs.length === 1) {
        return updateDocument(DB_PATHS.EVENT_USERS, eventUser.docs[0].id, {
          status,
        })
          .then(() => {
            return res.status(200).send('User Event has been updated.');
          })
          .catch((err) => {
            console.error(err);
            return next(httpErrors(500, err));
          });
      }
      // Else create a new one and respond 200
      else {
        return addToCollection(DB_PATHS.EVENT_USERS, {
          eid,
          user,
          status,
        })
          .then(() => {
            return res.status(200).send('User Event has been created.');
          })
          .catch((err) => {
            console.error(err);
            return next(httpErrors(500, err));
          });
      }
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }
  }),
);

export const userEventRoutes = router;
