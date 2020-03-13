import { isNumber, sanitizeString } from './DataValidator';
import { getDb } from './Firebase';
import { DB_PATHS } from './DBHelper';

export const USER_EVENT_STATUS = { HOST: 0, ATTENDING: 1, MAYBE: 2, NO: 3, INVITED: 4 };

export const EVENT_STATUS = { ACTIVE: 0, POSTPONED: 1, CANCELLED: 2 };

export const EVENT_CATEGORIES = [
  'Business',
  'Food & Drink',
  'Health',
  'Music',
  'Auto, Boat & Air',
  'Charity & Causes',
  'Community',
  'Family & Education',
  'Fashion',
  'Film & Media',
  'Hobbies',
  'Home & Lifestyle',
  'Performing & Visual Arts',
  'Government',
  'Spirituality',
  'School Activities',
  'Science & Tech',
  'Holiday',
  'Sports & Fitness',
  'Travel & Outdoor',
];

export const EVENT_TYPE = {
  PUBLIC: 0,
  PRIVATE: 1,
};

const validModyableKeys = [
  'name',
  'address',
  'category',
  'photoURL',
  'desc',
  'start',
  'end',
  'fee',
  'status',
  'type',
  'capacity',
];

export function verifyEvent(event: any): any {
  const newEvent: any = {};

  for (const key of validModyableKeys) {
    newEvent[key] = event[key];
  }

  if (
    !newEvent.name ||
    !newEvent.address ||
    !newEvent.category ||
    !newEvent.photoURL ||
    !newEvent.desc ||
    newEvent.type === null ||
    newEvent.type === undefined
  ) {
    throw new Error('Invalid event format.');
  }

  if (!isNumber(event.start)) {
    throw new Error('Invalid event start date.');
  }

  if (!isNumber(event.end)) {
    throw new Error('Invalid event end date.');
  }

  if (!isNumber(event.fee)) {
    throw new Error('Invalid event fee.');
  }

  if (event.category.length === 0 || !(event.category instanceof Array)) {
    throw new Error('Invalid event category.');
  }

  const result = event.category.every((category: string) => {
    return EVENT_CATEGORIES.includes(category);
  });

  if (!result) {
    throw new Error('Invalid event category.');
  }

  if (newEvent.status === null || newEvent.status === undefined) {
    newEvent.status = EVENT_STATUS.ACTIVE;
  }

  if (!isNumber(newEvent.status)) {
    throw new Error('Invalid event status.');
  }

  if (!isNumber(newEvent.type)) {
    throw new Error('Invalid event type.');
  }

  if (!isNumber(newEvent.capacity)) {
    throw new Error('Invalid capacity type.');
  }

  if (newEvent.type !== EVENT_TYPE.PRIVATE && newEvent.type !== EVENT_TYPE.PUBLIC) {
    throw new Error('Invalid event type.');
  }

  if (
    newEvent.status !== EVENT_STATUS.ACTIVE &&
    newEvent.status !== EVENT_STATUS.POSTPONED &&
    newEvent.status !== EVENT_STATUS.CANCELLED
  ) {
    throw new Error('Invalid event status.');
  }

  if (!newEvent.photoURL.includes('https://')) {
    throw new Error('Invalid photo url.');
  }

  newEvent.name = sanitizeString(newEvent.name);
  newEvent.start = Number(newEvent.start);
  newEvent.end = Number(newEvent.end);
  newEvent.address = sanitizeString(newEvent.address);
  newEvent.fee = Number(newEvent.fee);
  newEvent.photoURL = sanitizeString(newEvent.photoURL);
  newEvent.desc = sanitizeString(newEvent.desc);
  newEvent.status = Number(newEvent.status);
  newEvent.type = Number(newEvent.type);
  newEvent.capacity = Number(newEvent.capacity);

  if (newEvent.capacity < 1) {
    throw new Error('Event capacity must be greater than 0.');
  }

  if (newEvent.end < newEvent.start) {
    throw new Error('Event cannot end before it starts.');
  }

  return newEvent;
}

export async function checkEventCapacity(eid: string, capacity: number) {
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

  if (capacity < attendees.docs.length) {
    throw new Error('Capacity is too low, attendees have already RSVPed to the event.');
  }
}
