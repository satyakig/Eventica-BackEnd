import { isNumber } from './DataValidator';
import { USER_EVENT_STATUS } from './EventHelper';

export function verifyStatus(status: any): any {
  if (!isNumber(status)) {
    throw new Error('Status is a string');
  }

  if (
    status !== USER_EVENT_STATUS.HOST &&
    status !== USER_EVENT_STATUS.ATTENDING &&
    status !== USER_EVENT_STATUS.MAYBE &&
    status !== USER_EVENT_STATUS.NO &&
    status !== USER_EVENT_STATUS.INVITED
  ) {
    throw new Error('Not a valid status type');
  }

  return status;
}
