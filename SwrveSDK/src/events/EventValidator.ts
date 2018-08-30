import SwrveLogger from '../util/SwrveLogger';

abstract class EventValidator {
  public static isValidEventName(eventName: string): boolean {
    const restrictedNamesStartWith: string[] = ['Swrve.', 'swrve.'];

    for (const restricted of restrictedNamesStartWith) {
      if (eventName == null || eventName.startsWith(restricted)) {
        SwrveLogger.errorMsg('Event names cannot begin with: ' + restricted +
                              'This event will not be sent. Eventname:' + eventName);
        return false;
      }
    }
    return true;
  }
}

export default EventValidator;
