import asyncHandler from 'express-async-handler';
import httpErrors from 'http-errors';
import { Router } from 'express';
import { sanitizeString } from '../lib/DataValidator';
import { getEventData, verifyUserInEvent, checkinUser, verifyHost } from '../lib/UserEventHelper';
import { sendNotification } from '../lib/NotificationHelper';

const router = Router();

/**
 * Marks a ticket as used after scanning
 *
 * Sample JSON POST
 {
    "eid": "8UhyXDgfoBAJBboJkMQQ",
    "uid": "hAYk9Cyrqf7253kfOOSe" -> User ID of the user who's ticket you are validating
 }
 */
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const respTitle = 'Ticket Scanner';
    let respMessage = '';

    const user = sanitizeString(req.body.user);
    // const user = await getUserFromRequest(req);
    const eid = sanitizeString(req.body.eid);
    const uid = sanitizeString(req.body.uid);

    // Validate the user who sent the request is the host of the event
    try {
      await verifyHost(eid, uid);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    // Validate the event is active and hasn't ended
    try {
      await getEventData(eid);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    // Validate that the users ticket is part of the event
    let userEvent: any;
    let userEventData: any;
    try {
      const userEventArr = await verifyUserInEvent(eid, uid);
      userEvent = userEventArr[0];
      userEventData = userEventArr[1];
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    // Validate that the ticket hasn't been used
    const checkedIn = userEventData.checkedIn;

    if (checkedIn) {
      return res.status(200).send('User has already checked in');
    }

    // Checkin this user
    try {
      await checkinUser(userEvent);
    } catch (err) {
      respMessage = err.message;
      sendNotification(user, false, respTitle, respMessage);
      return next(httpErrors(400, respMessage));
    }

    return res.status(200).send('Successfully scanned the ticket');
  }),
);

export const useTicketRoutes = router;
