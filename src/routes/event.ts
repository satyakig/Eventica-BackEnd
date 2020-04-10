import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import {
  checkEventCapacity,
  EVENT_STATUS,
  USER_EVENT_STATUS,
  validateHost,
  verifyEvent,
} from '../lib/EventHelper';
import { addToCollection, DB_PATHS, setDocument, updateDocument } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { sendNotification } from '../lib/NotificationHelper';

const router = Router();

/**
 * Create Event
 * Sample JSON POST
 {
    "name": "Event name 2",
    "address": "address 2",
    "category": ["Fashion", "Business"],
    "photoURL": "url 2",
    "desc": "description 2",
    "start": 10,
    "end": 1234567,
    "fee": 10,
    "type": 0,
    "capacity": 10
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const respTitle = 'Event Create';
    let respMessage = '';
    const user = await getUserFromRequest(req);

    let event: any;
    try {
      event = verifyEvent(req.body);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (event.end < moment().valueOf()) {
      respMessage = 'Event end date has to be in the future.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    return addToCollection(DB_PATHS.EVENTS, {})
      .then((doc) => {
        const eid = doc.id;

        const now = moment().valueOf();
        event['createdOn'] = now;
        event['lastUpdated'] = now;
        event['status'] = EVENT_STATUS.ACTIVE;
        event['eid'] = eid;
        event['createdBy'] = {
          email: user.email,
          name: user.name,
        };

        const addEvent = setDocument(DB_PATHS.EVENTS, eid, event);
        const addUser = addToCollection(DB_PATHS.EVENT_USERS, {
          eid,
          uid: user.uid,
          status: USER_EVENT_STATUS.HOST,
          name: user.name,
          photoURL: user.photoURL,
          paid: true,
          fee: 0,
          checkedIn: true,
        });

        return Promise.all([addEvent, addUser]);
      })
      .then(() => {
        respMessage = `${event.name} has been created.`;
        sendNotification(user, true, respTitle, respMessage);
        return res.status(200).send(respMessage);
      });
  }),
);

/**
 * Update Event
 * Sample JSON PATCH
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "name": "Event name 2",
    "address": "address 2",
    "category": ["Fashion", "Business"],
    "photoURL": "url 2",
    "desc": "description 2",
    "start": 10,
    "end": 1234567,
    "fee": 10,
    "status": 2,
    "type": 1,
    "capacity": 10
 }
 */
router.patch(
  '/',
  asyncHandler(async (req, res, next) => {
    const respTitle = 'Event Update';
    let respMessage = '';
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    let event: any;
    try {
      await validateHost(eid, user);
      event = verifyEvent(req.body);
      event['lastUpdated'] = moment().valueOf();

      await checkEventCapacity(eid, event.capacity);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (event.end < moment().valueOf()) {
      respMessage = 'Cannot update event past the end date.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    return updateDocument(DB_PATHS.EVENTS, eid, event).then(() => {
      respMessage = `${event.name} has been updated.`;
      sendNotification(user, true, respTitle, respMessage);
      return res.status(200).send(respMessage);
    });
  }),
);

export const eventRoutes = router;
