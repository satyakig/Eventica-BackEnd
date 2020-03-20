import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { getUserFromRequest } from '../lib/AuthHelper';
import { addToCollection, DB_PATHS, updateDocument } from '../lib/DBHelper';
import { getDb } from '../lib/Firebase';
import { EVENT_TYPE, USER_EVENT_STATUS } from '../lib/EventHelper';
import {
  getEventData,
  getStringFromStatus,
  verifyEventCapacity,
  verifyStatus,
} from '../lib/UserEventHelper';
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

    let status: any;
    let event: any;
    let eventUser: any;

    try {
      status = verifyStatus(req.body.status);
      event = await getEventData(eid);

      eventUser = await getDb()
        .collection(DB_PATHS.EVENT_USERS)
        .where('eid', '==', eid)
        .where('uid', '==', user.uid)
        .get();

      if (status === USER_EVENT_STATUS.ATTENDING) {
        await verifyEventCapacity(eid);
      }
    } catch (err) {
      return next(httpErrors(400, err));
    }

    if (event.type === EVENT_TYPE.PUBLIC && eventUser.docs.length !== 1) {
      next(httpErrors('You don not have permissions to join this event.'));
    }

    // If the user already has an entry
    if (eventUser.docs.length === 1) {
      const docId = eventUser.docs[0].id;
      const userEventData = eventUser.docs[0].data();
      const paid = userEventData.paid;

      const update = {
        status,
        paid: status === USER_EVENT_STATUS.ATTENDING ? true : paid,
      };

      return updateDocument(DB_PATHS.EVENT_USERS, docId, update).then(() => {
        return res
          .status(200)
          .send(`You have RSVPed to the event with: ${getStringFromStatus(status)}`);
      });
    }

    // Else create a new one
    return addToCollection(DB_PATHS.EVENT_USERS, {
      eid,
      uid: user.uid,
      status,
      name: user.name,
      photoURL: user.photoURL,
      paid: status === USER_EVENT_STATUS.ATTENDING,
    }).then(() => {
      return res
        .status(200)
        .send(`You have RSVPed to the event with: ${getStringFromStatus(status)}`);
    });
  }),
);

export const userEventRoutes = router;
