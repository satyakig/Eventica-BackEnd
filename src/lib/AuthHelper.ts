import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import { getAuth } from './Firebase';
import { DB_PATHS, getDocument } from './DBHelper';
import { LOGGER } from './Logger';

/**
 * Gets the id of the user from the provided email address
 * @param { string } email User's email
 * @returns User's record if there ares any
 */
export function getUserRecordByEmail(email: string): Promise<FirebaseFirestore.DocumentData> {
  return getAuth()
    .getUserByEmail(email)
    .then((user) => {
      return getDocument(DB_PATHS.USERS, user.uid);
    })
    .then((doc) => {
      if (!doc.exists) {
        throw new Error('User account could not be found.');
      }

      const data = doc.data();

      if (!data) {
        throw new Error('User account could not be found.');
      }

      return data;
    });
}

/**
 * The goal of this method is to return a Promise containing the information of a user in firebase auth
 * @param uid - UID provided to this endpoint, representing the UID of a user in Firebase auth (ideally)
 * @returns Promise - Returns a promise containing the user record associated with the provided uid
 */
export function getUser(uid: string): Promise<FirebaseFirestore.DocumentData> {
  return getAuth()
    .getUser(uid)
    .then((user) => {
      return getDocument(DB_PATHS.USERS, user.uid);
    })
    .then((doc) => {
      if (!doc.exists) {
        throw new Error('User account could not be found.');
      }

      const data = doc.data();

      if (!data) {
        throw new Error('User account could not be found.');
      }

      return data;
    });
}

export function getUserFromRequest(req: any): Promise<FirebaseFirestore.DocumentData> {
  const uid = req.headers.authorization.split(' ')[1];

  return getUser(uid);
}

/**
 * This method is designed to be used whenever a user hits an endpoint that requires authentication. If
 * authentication is successful, then
 * @param req - The request body for the API call
 * @param res - The response abject for the API call
 * @param next - Redirects the API call to the appropriate subsequent endpoint depending on the result of this method
 * @returns boolean - Returns a true or false depending on whether the user was successfully authenticated
 */
export async function checkIfAuthorized(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(httpErrors(401, 'No auth header provided.'));
  }

  const splitHeader = authHeader.split(' ');

  if (splitHeader.length == 1) {
    return next(httpErrors(401, 'No bearer token provided.'));
  }

  try {
    await getUserFromRequest(req);

    return next();
  } catch (error) {
    LOGGER.error(error);
    return next(httpErrors(401, error));
  }
}
