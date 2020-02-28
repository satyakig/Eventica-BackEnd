import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import admin from 'firebase-admin';
import { getAuth } from './Firebase';

/**
 * Gets the id of the user from the provided email address
 * @param { string } email User's email
 * @returns User's record if there ares any
 */
export function getUserRecordByEmail(email: string): Promise<admin.auth.UserRecord> {
  return getAuth().getUserByEmail(email);
}

/**
 * The goal of this method is to return a Promise containing the information of a user in firebase auth
 * @param uid - UID provided to this endpoint, representing the UID of a user in Firebase auth (ideally)
 * @returns Promise - Returns a promise containing the user record associated with the provided uid
 */
export function getUser(uid: string): Promise<admin.auth.UserRecord> {
  return getAuth().getUser(uid);
}

export function getUserFromRequest(req: any): Promise<string> {
  const uid = req.headers.authorization.split(' ')[1];

  return getUser(uid).then((user) => {
    return user.uid;
  });
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
    return next(httpErrors(401, `No auth header specified for request to ${req.url}`));
  }

  const splitHeader = authHeader.split(' ');

  if (splitHeader.length == 1) {
    return next(httpErrors(401, `No bearer token specified for request to ${req.url}`));
  }

  const authToken = splitHeader[1];

  try {
    await getUser(authToken);

    return next();
  } catch (error) {
    const errorMessage = `Failed to authenticate for ${authToken}, with error: ${error}`;
    console.error(errorMessage);

    return next(httpErrors(401, errorMessage));
  }
}
