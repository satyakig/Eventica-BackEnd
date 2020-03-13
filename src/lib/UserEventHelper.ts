import { isNumber } from './DataValidator';
import { USER_EVENT_STATUS } from './EventHelper';
import { getDb } from './Firebase';
import { DB_PATHS } from './DBHelper';

export function verifyStatus(status: any): any {
  if (!isNumber(status)) {
    throw new Error('Status is not a number.');
  }

  if (
    status !== USER_EVENT_STATUS.ATTENDING &&
    status !== USER_EVENT_STATUS.MAYBE &&
    status !== USER_EVENT_STATUS.NO
  ) {
    throw new Error('Not a valid status type.');
  }

  return status;
}

export function getStringFromStatus(status: number): string {
  switch (status) {
    case USER_EVENT_STATUS.ATTENDING:
      return 'Attending';
    case USER_EVENT_STATUS.MAYBE:
      return 'Maybe';
    case USER_EVENT_STATUS.NO:
      return 'Not Attending';
    default:
      return '';
  }
}

export async function verifyEventCapacity(eid: string) {
  const event = await getDb()
    .collection(DB_PATHS.EVENTS)
    .doc(eid)
    .get()
    .then((doc) => {
      return doc.data();
    });

  if (!event) {
    throw new Error('Event data not found.');
  }

  const attendees = await getDb()
    .collection(DB_PATHS.EVENT_USERS)
    .where('eid', '==', eid)
    .where('status', '==', USER_EVENT_STATUS.ATTENDING)
    .get();

  if (event.capacity <= attendees.docs.length) {
    throw new Error('This event is full.');
  }
}
