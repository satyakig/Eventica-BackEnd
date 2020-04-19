import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import moment from 'moment';
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
import { sendNotification } from '../lib/NotificationHelper';

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
    const respTitle = 'Event RSVP';
    let respMessage = '';

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
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (event.type === EVENT_TYPE.PRIVATE && eventUser.docs.length !== 1) {
      respMessage = 'You do not have permissions to join this event.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (event.end < moment().valueOf()) {
      respMessage = 'Cannot join or leave event past the end date.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    // If the user already has an entry
    if (eventUser.docs.length === 1) {
      const docId = eventUser.docs[0].id;
      const userEventData = eventUser.docs[0].data();

      const update: any = {
        status,
        paid: status === USER_EVENT_STATUS.ATTENDING ? true : userEventData.paid,
      };

      if (status === USER_EVENT_STATUS.ATTENDING) {
        update.fee = event.fee;
      }

      return updateDocument(DB_PATHS.EVENT_USERS, docId, update).then(() => {
        respMessage = `You have RSVPed to ${event.name} with: ${getStringFromStatus(status)}`;
        sendNotification(user, true, respTitle, respMessage);
        return res.status(200).send(respMessage);
      });
    } else {
      // Else create a new one
      return addToCollection(DB_PATHS.EVENT_USERS, {
        eid,
        uid: user.uid,
        status,
        name: user.name,
        photoURL: user.photoURL,
        paid: status === USER_EVENT_STATUS.ATTENDING,
        fee: event.fee,
        checkedIn: false,
      }).then(() => {
        respMessage = `You have RSVPed to ${event.name} with: ${getStringFromStatus(status)}`;
        sendNotification(user, true, respTitle, respMessage);
        return res.status(200).send(respMessage);
      });
    }
  }),
);

export const userEventRoutes = router;
