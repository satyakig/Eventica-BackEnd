import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import { EVENT_STATUS, USER_EVENT_STATUS, verifyEvent } from '../lib/EventHelper';
import {
  addToCollection,
  DB_PATHS,
  getDocument,
  setDocument,
  updateDocument,
} from '../lib/DBHelper';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    try {
      const event = verifyEvent(req.body);
      const uid = await getUserFromRequest(req);

      return addToCollection(DB_PATHS.EVENTS, {})
        .then((doc) => {
          const eid = doc.id;
          event['createdOn'] = moment().unix();
          event['status'] = EVENT_STATUS.ACTIVE;

          const addEvent = setDocument(DB_PATHS.EVENTS, eid, event);
          const addUser = addToCollection(DB_PATHS.EVENT_USERS, {
            eid,
            uid,
            status: USER_EVENT_STATUS.HOST,
          });

          return Promise.all([addEvent, addUser]);
        })
        .then(() => {
          return res.status(200).send('Created new event.');
        })
        .catch((err) => {
          return next(httpErrors(500, err));
        });
    } catch (err) {
      return next(httpErrors(400, err));
    }
  }),
);

router.patch(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = req.body.eid;

    try {
      const event = await getDocument(DB_PATHS.EVENTS, eid);
      if (!event.exists) {
        return next(httpErrors(404, `Event ${eid} does not exist.`));
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    try {
      const event = verifyEvent(req.body);

      return updateDocument(DB_PATHS.EVENTS, eid, event)
        .then(() => {
          return res.status(200).send('Updated event.');
        })
        .catch((err) => {
          return next(httpErrors(500, err));
        });
    } catch (err) {
      return next(httpErrors(400, err));
    }
  }),
);

router.delete(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = req.body.eid;

    try {
      const event = await getDocument(DB_PATHS.EVENTS, eid);
      if (!event.exists) {
        return next(httpErrors(404, `Event ${eid} does not exist.`));
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    return updateDocument(DB_PATHS.EVENTS, eid, {
      status: EVENT_STATUS.CANCELLED,
    })
      .then(() => {
        return res.status(200).send('Cancelled event.');
      })
      .catch((err) => {
        return next(httpErrors(500, err));
      });
  }),
);

export const eventRoutes = router;
