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
    const user = await getUserFromRequest(req);

    let event: any;
    try {
      event = verifyEvent(req.body);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    return addToCollection(DB_PATHS.EVENTS, {})
      .then((doc) => {
        const eid = doc.id;

        const now = moment().unix();
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
        });

        return Promise.all([addEvent, addUser]);
      })
      .then(() => {
        return res.status(200).send('Event has been created.');
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
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    let event: any;
    try {
      await validateHost(eid, user);
      event = verifyEvent(req.body);
      event['lastUpdated'] = moment().unix();

      await checkEventCapacity(eid, event.capacity);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    return updateDocument(DB_PATHS.EVENTS, eid, event).then(() => {
      return res.status(200).send('Event has been updated.');
    });
  }),
);

/**
 * Delete Event
 * Sample JSON PATCH
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ"
 }
 */
router.delete(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    try {
      await validateHost(eid, user);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    return updateDocument(DB_PATHS.EVENTS, eid, {
      status: EVENT_STATUS.CANCELLED,
      lastUpdated: moment().unix(),
    }).then(() => {
      return res.status(200).send('Event has been cancelled.');
    });
  }),
);

export const eventRoutes = router;
