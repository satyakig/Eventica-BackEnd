import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import { EVENT_STATUS, verifyEvent } from '../lib/EventHelper';
import { addToCollection, DB_PATHS, setDocument } from '../lib/DBHelper';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const body = req.body;

    try {
      const event = verifyEvent(body);
      const uid = await getUserFromRequest(req);

      return addToCollection(DB_PATHS.EVENTS, {})
        .then((doc) => {
          const eid = doc.id;
          event['createdOn'] = moment().unix();

          const addEvent = setDocument(DB_PATHS.EVENTS, eid, event);
          const addUser = addToCollection(DB_PATHS.EVENT_USERS, {
            eid,
            uid,
            status: EVENT_STATUS.HOST,
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

export const eventRoutes = router;
