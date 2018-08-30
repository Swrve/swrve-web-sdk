/** Internal Event */
export declare type EventType = 'session_start' | 'generic_campaign_event' | 'event' | 'user' | 'purchase' | 'currency_given' | 'iap' | 'device_update';

/** Hardcode: Events types. */
export const eventTypes: {
  sessionStartEvent: EventType;
  namedEvent: EventType;
  userUpdateEvent: EventType;
  deviceUpdateEvent: EventType;
  purchaseEvent: EventType;
} = {
  deviceUpdateEvent: 'device_update',
  namedEvent: 'event',
  purchaseEvent: 'purchase',
  sessionStartEvent: 'session_start',
  userUpdateEvent: 'user',
};

/** First session event name */
export const firstSessionEventName: string = 'Swrve.first_session';
export const sessionStartEventName: string = 'Swrve.session_start';

export interface IEventDBData {
  type: EventType;
  time: number;
  seqnum: number;
  name?: string;
  payload?: object;
  attributes?: object;
}

export interface IQAWrappedEvent {
  log_source: string;
  log_details: IEventDBData;
  seqNum: number;
  type: string;
  time: number;
  log_type: string;
}

export interface INamedEventParams {
  name?: string; // not needed for session start and swrve events
  payload?: object;
}

export interface ISessionStartParams {
  name: string;
}

export interface IPurchaseParams {
  cost: number;
  currency: string;
  item: string;
  quantity: number;
}

export interface IUserUpdateWithDateParams {
  name: string;
  date: Date;
}

export interface IUserUpdateClientInfoAttributes {
  'swrve.user_id': string;
  'swrve.browser': string | null;
  'swrve.browser_version': string | null;
  'swrve.os': string | null;
  'swrve.os_version': string | null;
  'swrve.device_height': string;
  'swrve.device_width': string;
  'swrve.language': string;
  'swrve.timezone': string | null;
  'swrve.latitude': string;
  'swrve.longitude': string;
  'swrve.user_agent': string | null;
  'swrve.install_date': string;
}

export interface IPurchaseEventDBData {
  type: EventType;
  time: number;
  seqnum: number;
  cost: number;
  currency: string;
  item: string;
  quantity: number;
}
