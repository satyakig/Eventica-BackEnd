import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS, updateDocument } from '../lib/DBHelper';
import { getDb } from '../lib/Firebase';
import { EVENT_STATUS, USER_EVENT_STATUS } from '../lib/EventHelper';
import { getStringFromStatus, verifyEventCapacity, verifyStatus } from '../lib/UserEventHelper';
import { sanitizeString } from '../lib/DataValidator';

const router = Router();

/**
 * Update event users
 * Sample JSON POST
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "status": Use the USER_EVENT_STATUS from EventHelper.ts
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const user = await getUserFromRequest(req);
    const eid = sanitizeString(req.body.eid);

    // Check if event status is valid
    let status: any;
    try {
      status = verifyStatus(req.body.status);
      status = Number(status);
    } catch (err) {
      console.error(err);
      return next(httpErrors(400, err));
    }

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
        .where('uid', '==', user.uid)
        .get();
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    if (status === USER_EVENT_STATUS.ATTENDING) {
      try {
        await verifyEventCapacity(eid);
      } catch (err) {
        console.error(err);
        return next(httpErrors(400, err));
      }
    }

    // Create or update eventUser element
    try {
      // If the user already has an entry
      if (eventUser.docs.length === 1) {
        return updateDocument(DB_PATHS.EVENT_USERS, eventUser.docs[0].id, {
          status,
        })
          .then(() => {
            return res
              .status(200)
              .send(`You have RSVPed to the event with: ${getStringFromStatus(status)}`);
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
          uid: user.uid,
          status,
        })
          .then(() => {
            return res
              .status(200)
              .send(`You have RSVPed to the event with: ${getStringFromStatus(status)}`);
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
