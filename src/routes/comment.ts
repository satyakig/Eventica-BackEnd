import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import {
  addToCollection,
  DB_PATHS,
  getDocument,
  setDocument,
  updateDocument,
} from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { getDb } from '../lib/Firebase';
import { verifyComment } from '../lib/CommentHelper';

const router = Router();

/**
 * Create Comment
 * Sample JSON POST
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "message": "asdadsa", (optional)
    "photoURL": "asdasdsad" (optional)
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = sanitizeString(req.body.eid);

    if (!eid) {
      return next(httpErrors(400, `Invalid event id: ${eid}.`));
    }

    let user: any;
    try {
      user = await getUserFromRequest(req);

      if (!user) {
        return next(httpErrors(404, 'User could not be found'));
      }

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
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    try {
      const event = await getDocument(DB_PATHS.EVENTS, eid);
      if (!event.exists) {
        return next(httpErrors(404, `Event with id: ${eid} does not exist.`));
      }
    } catch (err) {
      console.error(err);
      return next(httpErrors(500, err));
    }

    try {
      const comment = verifyComment(req.body);

      if (!user) {
        return next(httpErrors(404, 'User could not be found'));
      }

      return addToCollection(DB_PATHS.COMMENTS, {})
        .then((doc) => {
          const cid = doc.id;
          const now = moment().valueOf();
          comment['createdOn'] = now;
          comment['lastUpdated'] = now;
          comment['eid'] = eid;
          comment['cid'] = cid;
          comment['createdBy'] = {
            email: user.email,
            name: user.name,
            profile: user.photoURL,
          };

          return setDocument(DB_PATHS.COMMENTS, cid, comment);
        })
        .then(() => {
          return res.status(200).send('Uploaded new comment.');
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
 * Update Comment
 * Sample JSON PATCH
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "cid": "8UhyXDgfoBAJBboJkMQQ",
    "message": "asdadsa", (optional)
    "photoURL": "asdasdsad" (optional)
 }
 */
router.patch(
  '/',
  asyncHandler(async (req, res, next) => {
    const eid = sanitizeString(req.body.eid);
    const cid = sanitizeString(req.body.cid);

    if (!eid) {
      return next(httpErrors(400, `Invalid event id: ${eid}.`));
    }

    if (!cid) {
      return next(httpErrors(400, `Invalid comment id: ${cid}.`));
    }

    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return next(httpErrors(404, 'User could not be found'));
      }

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
    } catch (err) {
      return next(httpErrors(500, err));
    }

    try {
      const event = await getDocument(DB_PATHS.EVENTS, eid);
      if (!event.exists) {
        return next(httpErrors(404, `Event with id: ${eid} does not exist.`));
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    try {
      const comment = await getDocument(DB_PATHS.COMMENTS, cid);
      if (!comment.exists) {
        return next(httpErrors(404, `Comment with id: ${cid} does not exist.`));
      }
    } catch (err) {
      return next(httpErrors(500, err));
    }

    try {
      const comment = verifyComment(req.body);
      comment['lastUpdated'] = moment().valueOf();

      return updateDocument(DB_PATHS.COMMENTS, cid, comment)
        .then(() => {
          return res.status(200).send('Updated comment.');
        })
        .catch((err) => {
          return next(httpErrors(500, err));
        });
    } catch (err) {
      return next(httpErrors(400, err));
    }
  }),
);

export const commentRoutes = router;
