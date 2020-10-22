/** Internal Event */
export declare type EventType = 'session_start' | 'generic_campaign_event' | 'event' | 'user' | 'purchase' | 'currency_given' | 'iap' | 'device_update' | 'qa_log_event';
export declare type CampaignType = 'push';
export declare type ActionType = 'impression' | 'engaged' | 'button_click' | 'influenced';

/** Hardcode: Events types. */
export const eventTypes: {
  currencyGiven: EventType;
  deviceUpdateEvent: EventType;
  namedEvent: EventType;
  purchaseEvent: EventType;
  genericCampaignEvent: EventType;
  qaLogEvent: EventType;
  sessionStartEvent: EventType;
  userUpdateEvent: EventType;
  iapEvent: EventType;
} = {
  currencyGiven: 'currency_given',
  deviceUpdateEvent: 'device_update',
  genericCampaignEvent: 'generic_campaign_event',
  iapEvent: 'iap',
  namedEvent: 'event',
  purchaseEvent: 'purchase',
  qaLogEvent: 'qa_log_event',
  sessionStartEvent: 'session_start',
  userUpdateEvent: 'user',
};

/** First session event name */
export const firstSessionEventName: string = 'Swrve.first_session';
export const sessionStartEventName: string = 'Swrve.session_start';

// Stored in DB
interface IStoredEvent {
  time: number;
  type: EventType;
  seqnum: number;
}

export interface ICurrencyGivenDBData extends IStoredEvent {
  given_currency: string;
  given_amount: number;
}

export interface IEventDBData extends IStoredEvent  {
  name?: string;
  payload?: object;
  attributes?: IUserUpdateClientInfoAttributes|IUserUpdateWithDateParams;
}

export interface IGenericCampaignEventDBData extends IStoredEvent  {
  actionType: ActionType;
  campaignType: CampaignType;
  campaignId: number;
  id: number;
}

export interface IPurchaseEventDBData extends IStoredEvent  {
  cost: number;
  currency: string;
  item: string;
  quantity: number;
}

export interface IIAPEventDBData extends IStoredEvent  {
  cost: number;
  local_currency: string;
  quantity: number;
  product_id: string;
  rewards: { [id: string]: IRewardsParams; };
  app_store: string;
}

export interface IQAWrappedEvent extends IStoredEvent  {
  log_source: string;
  log_details: IQAEventLogDetails;
  log_type: string;
}

// Submodel of IQAWrappedEvent
export interface IQAEventLogDetails {
  type: EventType;
  parameters: any;
  seqnum: number;
  client_time: number;
}

export declare type StorableEvent = ICurrencyGivenDBData | IEventDBData | IGenericCampaignEventDBData | IPurchaseEventDBData | IQAWrappedEvent | IIAPEventDBData;

// Method signatures
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

export interface IIAPParams {
  cost: number;
  local_currency: string;
  quantity: number;
  product_id: string;
  rewards: { [id: string]: IRewardsParams; };
  app_store: string;
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
  [s: string]: string|number; // Any custom attributes
  'swrve.browser'?: string | null;
  'swrve.browser_version'?: string | null;
  'swrve.device_height'?: string | null;
  'swrve.device_width'?: string | null;
  'swrve.install_date'?: string | null;
  'swrve.language'?: string | null;
  'swrve.latitude'?: string | null;
  'swrve.longitude'?: string | null;
  'swrve.os'?: string | null;
  'swrve.os_version'?: string | null;
  'swrve.permission.web.push_notifications'?: string | null;
  'swrve.sdk_version'?: string | null;
  'swrve.timezone_name'?: string | null;
  'swrve.user_agent'?: string | null;
  'swrve.user_id'?: string | null;
  'swrve.utc_offset_seconds'?: number | null;
}

export interface IRewardsParams {
  amount: number;
  type: string;
}
