import moment from 'moment';
import { addToCollection, DB_PATHS } from './DBHelper';

export function sendNotification(user: any, success: boolean, title: string, message: string) {
  addToCollection(DB_PATHS.NOTIFICATIONS, {
    uid: user.uid,
    success,
    title,
    message,
    timestamp: moment().valueOf(),
    seen: false,
  });
}
