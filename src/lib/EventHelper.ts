import { isNumber, sanitizeString } from './DataValidator';

export const EVENT_STATUS = { HOST: 0, ATTENDING: 1, MAYBE: 2, NO: 3 };

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

export function verifyEvent(event: any): any {
  if (
    !event.name ||
    !event.start ||
    !event.end ||
    !event.address ||
    !event.category ||
    !event.fee ||
    !event.photoURL ||
    !event.desc
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

  if (event.category.length === 0) {
    throw new Error('Invalid event category.');
  }

  const result = event.category.every((category: string) => {
    return EVENT_CATEGORIES.includes(category);
  });

  if (!result) {
    throw new Error('Invalid event category.');
  }

  return {
    name: sanitizeString(event.name),
    start: Number(event.start),
    end: Number(event.end),
    address: sanitizeString(event.name),
    category: event.category,
    fee: Number(event.fee),
    photoURL: sanitizeString(event.photoURL),
    desc: sanitizeString(event.desc),
  };
}
