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
import { validateUserAndEvent, verifyComment } from '../lib/CommentHelper';

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
    const user = await getUserFromRequest(req);

    try {
      await validateUserAndEvent(eid, user);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    let comment: any;

    try {
      comment = verifyComment(req.body);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    return addToCollection(DB_PATHS.EVENT_COMMENTS, comment)
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

        return setDocument(DB_PATHS.EVENT_COMMENTS, cid, comment);
      })
      .then(() => {
        return res.status(200).send('Your post has been uploaded.');
      });
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
    const cid = sanitizeString(req.body.cid);
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    try {
      await validateUserAndEvent(eid, user);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    if (!cid) {
      return next(httpErrors(400, 'Invalid post id provided.'));
    }

    let comment: any;

    comment = await getDocument(DB_PATHS.EVENT_COMMENTS, cid);
    if (!comment.exists) {
      return next(httpErrors(400, 'This post does not exist.'));
    }

    try {
      comment = verifyComment(req.body);
    } catch (err) {
      return next(httpErrors(400, err));
    }

    comment['lastUpdated'] = moment().valueOf();
    return updateDocument(DB_PATHS.EVENT_COMMENTS, cid, comment).then(() => {
      return res.status(200).send('Your post has been updated.');
    });
  }),
);

export const commentRoutes = router;
