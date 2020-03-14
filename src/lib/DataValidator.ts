import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import isNumeric from 'validator/lib/isNumeric';
import isMobilePhone from 'validator/lib/isMobilePhone';

/**
 * Sanitizes a string by removing all control characters in the ASCII set
 * @param { input } input string to be sanitized
 * @returns { string } string with all characters that are not in between 0X20 and 0X7E removed
 */
export function sanitizeString(input: any): string {
  return String(input)
    .replace(/[^\x20-\x7E]/g, '')
    .replace('undefined', '')
    .replace('null', '')
    .trim();
}

/**
 * Validates if the request body is invalid by checking whether if it is null, undefined, instance of a function, or if the keys length are zero
 * @returns { boolean } whether the body is invalid or not
 * @param req - The request body for the API call
 * @param res - The response abject for the API call
 * @param next - Redirects the API call to the appropriate subsequent endpoint depending on the result of this method
 */
export async function isBodyInvalid(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.method === 'GET') {
    return next();
  }

  const body = req.body;

  if (!body || body === 'undefined' || body === 'null') {
    return next(httpErrors(400, 'Invalid request body.'));
  }

  if (body instanceof Function) {
    return next(httpErrors(400, 'Invalid request body.'));
  }

  if (Object.keys(body).length === 0) {
    return next(httpErrors(400, 'Invalid request body.'));
  }

  return next();
}

/**
 * @param input
 * @returns Whether the input is a number or not
 */
export function isNumber(input: any): boolean {
  const numString = sanitizeString(input);
  const numNum = Number(numString);

  return isNumeric(numString) && !Number.isNaN(numNum) && Number.isFinite(numNum);
}

/**
 * @param {string} input
 * @returns {boolean} Whether the input is a valid canadian mobile number
 */
export function isMobile(input: string): boolean {
  return isMobilePhone(input, 'en-CA');
}
