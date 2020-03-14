import { sanitizeString } from './DataValidator';

const validModyableKeys = ['message', 'photoURL'];

export function verifyComment(comment: any): any {
  const newComment: any = {};

  for (const key of validModyableKeys) {
    if (comment[key] !== undefined) {
      newComment[key] = comment[key];
    }
  }

  if (!newComment.message && !newComment.photoURL) {
    throw new Error('Invalid comment format.');
  }

  if (newComment.photoURL && !newComment.photoURL.includes('https://')) {
    throw new Error('Invalid photo url.');
  }

  newComment.message = sanitizeString(newComment.message);
  if (newComment.photoURL) {
    newComment.photoURL = sanitizeString(newComment.photoURL);
  }

  return newComment;
}
