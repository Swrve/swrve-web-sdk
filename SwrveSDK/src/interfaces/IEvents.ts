/** Internal Event */
export declare type EventType = 'session_start' | 'generic_campaign_event' | 'event' | 'user' | 'purchase' | 'currency_given' | 'iap' | 'device_update';
export declare type CampaignType = 'push';
export declare type ActionType = 'impression' | 'engaged' | 'button_click' | 'influenced';

/** Hardcode: Events types. */
export const eventTypes: {
  currencyGiven: EventType;
  deviceUpdateEvent: EventType;
  namedEvent: EventType;
  purchaseEvent: EventType;
  genericCampaignEvent: EventType;
  sessionStartEvent: EventType;
  userUpdateEvent: EventType;
} = {
  currencyGiven: 'currency_given',
  deviceUpdateEvent: 'device_update',
  genericCampaignEvent: 'generic_campaign_event',
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

export interface IPurchaseEventDBData {
  type: EventType;
  time: number;
  seqnum: number;
  cost: number;
  currency: string;
  item: string;
  quantity: number;
}

export interface ICurrencyGivenDBData {
  type: EventType;
  time: number;
  seqnum: number;
  given_currency: string;
  given_amount: number;
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

export interface ICurrencyParams {
  amount: number;
  currency: string;
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

export interface IGenericCampaignEventParams {
  actionType: ActionType;
  campaignType: CampaignType;
  campaignId: number;
  id: number;
}

export interface IUserUpdateClientInfoAttributes {
  'swrve.browser': string | null;
  'swrve.browser_version': string | null;
  'swrve.device_height': string;
  'swrve.device_width': string;
  'swrve.install_date': string;
  'swrve.language': string;
  'swrve.latitude': string;
  'swrve.longitude': string;
  'swrve.os': string | null;
  'swrve.os_version': string | null;
  'swrve.permission.web.push_notifications': string;
  'swrve.sdk_version': string;
  'swrve.timezone_name': string | null;
  'swrve.user_agent': string | null;
  'swrve.user_id': string;
  'swrve.utc_offset_seconds': number;
}

export interface IGenericCampaignEventDBData {
  actionType: ActionType;
  campaignType: CampaignType;
  campaignId: number;
  id: number;
  seqnum: number;
  type: EventType;
  time: number;
}

export interface IPurchaseEventDBData {
  cost: number;
  currency: string;
  item: string;
  quantity: number;
  seqnum: number;
  type: EventType;
  time: number;
}
