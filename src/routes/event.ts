import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import { EVENT_STATUS, USER_EVENT_STATUS, verifyEvent } from '../lib/EventHelper';
import { addToCollection, DB_PATHS, setDocument, updateDocument } from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';

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
    "type": 0
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    try {
      const event = verifyEvent(req.body);
      const user = await getUserFromRequest(req);

      return addToCollection(DB_PATHS.EVENTS, {})
        .then((doc) => {
          const eid = doc.id;
          event['createdOn'] = moment().unix();
          event['status'] = EVENT_STATUS.ACTIVE;
          event['eid'] = eid;

          const addEvent = setDocument(DB_PATHS.EVENTS, eid, event);
          const addUser = addToCollection(DB_PATHS.EVENT_USERS, {
            eid,
            uid: user.uid,
            status: USER_EVENT_STATUS.HOST,
          });

          return Promise.all([addEvent, addUser]);
        })
        .then(() => {
          return res.status(200).send('Event has been created.');
        })
        .catch((err) => {
          console.error(err);
          return next(httpErrors(500, err));
        });
    } catch (err) {
      console.error(err);
      return next(httpErrors(400, err));
    }
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
    "type": 1
 }
 */
router.patch(
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
        .get();

      if (eventUser.docs.length !== 1) {
        return next(
          httpErrors(
            400,
            'Event could not be found or user does not have privileges to access this event.',
          ),
        );
      }

      const eventData = eventUser.docs[0].data();
      if (eventData.status !== USER_EVENT_STATUS.HOST) {
        return next(httpErrors(400, 'User does not have privileges to modify this event.'));
      }
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    try {
      const event = verifyEvent(req.body);
      return updateDocument(DB_PATHS.EVENTS, eid, event)
        .then(() => {
          return res.status(200).send('Event has been updated.');
        })
        .catch((err) => {
          console.error(err);
          return next(httpErrors(500, err));
        });
    } catch (err) {
      console.error(err);
      return next(httpErrors(400, err));
    }
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

    if (!eid) {
      return next(httpErrors(400, 'Invalid event id provided.'));
    }

    try {
      const user = await getUserFromRequest(req);
      const eventUser = await getDb()
        .collection(DB_PATHS.EVENT_USERS)
        .where('eid', '==', eid)
        .where('uid', '==', user.uid)
        .get();

      if (eventUser.docs.length !== 1) {
        return next(
          httpErrors(
            400,
            'Event could not be found or user does not have privileges to access this event.',
          ),
        );
      }

      const eventData = eventUser.docs[0].data();
      if (eventData.status !== USER_EVENT_STATUS.HOST) {
        return next(httpErrors(400, 'User does not have privileges to modify this event.'));
      }
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    return updateDocument(DB_PATHS.EVENTS, eid, {
      status: EVENT_STATUS.CANCELLED,
    })
      .then(() => {
        return res.status(200).send('Event has been cancelled.');
      })
      .catch((err) => {
        console.error(err);
        return next(httpErrors(500, err));
      });
  }),
);

export const eventRoutes = router;
