import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import moment from 'moment';
import { getUserFromRequest } from '../lib/AuthHelper';
import {
  addToCollection,
  DB_PATHS,
  deleteDocument,
  getDocument,
  setDocument,
  updateDocument,
} from '../lib/DBHelper';
import { sanitizeString } from '../lib/DataValidator';
import { validateUserAndEvent, verifyComment } from '../lib/CommentHelper';
import { sendNotification } from '../lib/NotificationHelper';

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
    const respTitle = 'Message Create';
    let respMessage = '';
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    try {
      await validateUserAndEvent(eid, user);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    let comment: any;

    try {
      comment = verifyComment(req.body);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
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
        respMessage = 'Your message has been posted to the event.';
        sendNotification(user, true, respTitle, respMessage);
        return res.status(200).send(respMessage);
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
    const respTitle = 'Message Update';
    let respMessage = '';
    const cid = sanitizeString(req.body.cid);
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    try {
      await validateUserAndEvent(eid, user);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (!cid) {
      respMessage = 'Invalid message id provided.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    let comment: any;

    comment = await getDocument(DB_PATHS.EVENT_COMMENTS, cid);
    if (!comment.exists) {
      respMessage = 'The message specified does not exist.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    try {
      comment = verifyComment(req.body);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    comment['lastUpdated'] = moment().valueOf();
    return updateDocument(DB_PATHS.EVENT_COMMENTS, cid, comment).then(() => {
      respMessage = 'Your message has been updated.';
      sendNotification(user, true, respTitle, respMessage);
      return res.status(200).send(respMessage);
    });
  }),
);

/**
 * Delete Comment
 * Sample JSON PATCH
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "cid": "rHhp2GgOLbrqfIsK1jLw"
 }
 */
router.delete(
  '/',
  asyncHandler(async (req, res, next) => {
    const respTitle = 'Message Delete';
    let respMessage = '';
    const cid = sanitizeString(req.body.cid);
    const eid = sanitizeString(req.body.eid);
    const user = await getUserFromRequest(req);

    try {
      await validateUserAndEvent(eid, user);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    if (!cid) {
      respMessage = 'Invalid message id provided.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    const comment = await getDocument(DB_PATHS.EVENT_COMMENTS, cid);
    if (!comment.exists) {
      respMessage = 'The message specified does not exist.';
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    return deleteDocument(DB_PATHS.EVENT_COMMENTS, cid).then(() => {
      respMessage = 'Your message has been deleted.';
      sendNotification(user, true, respTitle, respMessage);
      return res.status(200).send(respMessage);
    });
  }),
);

export const commentRoutes = router;
