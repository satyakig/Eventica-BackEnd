import { sanitizeString } from './DataValidator';
import { getDb } from './Firebase';
import { DB_PATHS } from './DBHelper';

const validModifiableKeys = ['message', 'photoURL'];

export function verifyComment(comment: any): any {
  const newComment: any = {};

  for (const key of validModifiableKeys) {
    if (comment[key] !== undefined) {
      newComment[key] = comment[key];
    }
  }

  if (!newComment.message && !newComment.photoURL) {
    throw new Error('Your post must include a message or a picture.');
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

export async function validateUserAndEvent(eid: string, user: any) {
  if (!eid) {
    throw new Error('Invalid event id provided.');
  }

  const eventUser = await getDb()
    .collection(DB_PATHS.EVENT_USERS)
    .where('eid', '==', eid)
    .where('uid', '==', user.uid)
    .get();

  if (eventUser.docs.length !== 1) {
    throw new Error(
      'Event could not be found or you does not have privileges to access this event.',
    );
  }
}
