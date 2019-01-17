import DateHelper from '../helpers/DateHelper';
import {
  ActionType,
  CampaignType,
  EventType,
  eventTypes,
  ICurrencyGivenDBData,
  IEventDBData,
  IGenericCampaignEventDBData,
  IIAPEventDBData,
  IPurchaseEventDBData,
  IQAEventLogDetails,
  IQAWrappedEvent,
  IRewardsParams,
  IUserUpdateClientInfoAttributes,
  IUserUpdateWithDateParams,
} from '../interfaces/IEvents';

import {
  appStore,
} from '../helpers/ClientInfoConstants';

class EventFactory {
  public constructEvent(seqnum: number, time: number, type: string, name?: string, payload?: object): IEventDBData {
    const requestBody: IEventDBData = {
      seqnum,
      time,
      type: type as EventType,
    };

    if (name != null) {
      requestBody.name = name;
    }
      /** if the payload is empty we must populate it */
    requestBody.payload = (payload != null) ? payload : {};
    return requestBody;
  }

  public constructQAEvent(event: IEventDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: event.time,
      parameters: {
        name: event.name,
      },
      seqnum: event.seqnum,
      type: event.type,
    };

    if (event.name && event.payload) {
      logDetails.parameters = {
        name: event.name,
        payload: event.payload,
      };
    }

    if (event.name && !event.payload) {
      logDetails.parameters = {
        name: event.name,
      };
    }

    if (!event.name && !event.payload) {
      logDetails.parameters = {};
    }

    return this.constructQAWrappedEvent(logDetails);
  }

  public constructSessionStart(seqnum: number, time: number, name?: string, payload?: object): IEventDBData {
    return this.constructEvent(seqnum, time, eventTypes.sessionStartEvent, name, payload);
  }

  public constructQASessionStart(sessionStart: IEventDBData): IQAWrappedEvent {
    return this.constructQAEvent(sessionStart);
  }

    /** User Update */
  public constructUserUpdate(seqnum: number, time: number, attributes: IUserUpdateClientInfoAttributes|IUserUpdateWithDateParams): IEventDBData {
    return {
      attributes,
      seqnum,
      time,
      type: eventTypes.userUpdateEvent,
    } as IEventDBData;
  }

  /** QA variant of User Update */
  public constructQAUserUpdate(userUpdate: IEventDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: userUpdate.time,
      parameters: {
        attributes: userUpdate.attributes,
      },
      seqnum: userUpdate.seqnum,
      type: userUpdate.type,
    };

    return this.constructQAWrappedEvent(logDetails);
  }

  /** User Update With Date */
  public constructUserUpdateWithDate(seqnum: number, time: number, name: string, date: Date): IEventDBData {
    const utcDate = DateHelper.dateToUTCDate(date);
    const attributes = { name, date: DateHelper.dateToSwrveISOString(utcDate) };
    return this.constructUserUpdate(seqnum, time, attributes);
  }

  /** QA variant of User Update with Date */
  public constructQAUserUpdateWithDate(userUpdateWithDate: IEventDBData): IQAWrappedEvent {
    return this.constructQAUserUpdate(userUpdateWithDate);
  }

  /** Generic Campaign Event */
  public constructGenericCampaignEvent(seqnum: number, time: number, campaignType: CampaignType, campaignId: number, id: number, actionType: ActionType): IGenericCampaignEventDBData {
    return {
      actionType,
      campaignId,
      campaignType,
      id,
      seqnum,
      time,
      type: eventTypes.genericCampaignEvent,
    };
  }

  /** Device Update */
  public constructDeviceUpdate(seqnum: number, time: number, attributes: IUserUpdateClientInfoAttributes): IEventDBData {
    return {
      attributes,
      seqnum,
      time,
      type: eventTypes.deviceUpdateEvent,
    };
  }

  /** QA variant of Device Update */
  public constructQADeviceUpdate(deviceUpdate: IEventDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: deviceUpdate.time,
      parameters: {
        attributes: deviceUpdate.attributes,
      },
      seqnum: deviceUpdate.seqnum,
      type: deviceUpdate.type,
    };

    return this.constructQAWrappedEvent(logDetails);
  }

    /** Purchase Event */
  public constructPurchaseEvent(seqnum: number, time: number, item: string, currency: string, cost: number, quantity: number): IPurchaseEventDBData {
    return {
      cost,
      currency,
      item,
      quantity,
      seqnum,
      time,
      type: eventTypes.purchaseEvent,
    };
  }

    /** QA variant of Purchase Event */
  public constructQAPurchaseEvent(event: IPurchaseEventDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: event.time,
      parameters: {
        cost: event.cost,
        currency: event.currency,
        item: event.item,
        quantity: event.quantity,
      },
      seqnum: event.seqnum,
      type: event.type,
    };

    return this.constructQAWrappedEvent(logDetails);
  }

        /** IAP Event */
  public constructIAPEvent(seqnum: number, time: number, rewards: { [id: string]: IRewardsParams; }, localCurrency: string, cost: number, quantity: number, productId: string): IIAPEventDBData {
    return {
      app_store : appStore,
      cost,
      local_currency: localCurrency,
      product_id : productId,
      quantity,
      rewards,
      seqnum,
      time,
      type: eventTypes.iapEvent,
    };
  }

    /** QA variant of IAP Event */
  public constructQAIAPEvent(event: IIAPEventDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: event.time,
      parameters: {
        app_store: appStore,
        cost: event.cost,
        local_currency: event.local_currency,
        product_id : event.product_id,
        quantity: event.quantity,
        rewards : event.rewards,
      },
      seqnum: event.seqnum,
      type: event.type,
    };

    return this.constructQAWrappedEvent(logDetails);
  }

  /** Currency Given */
  public constructCurrencyGiven(seqnum: number, time: number, currency: string, amount: number): ICurrencyGivenDBData {
    return {
      given_amount: amount,
      given_currency: currency,
      seqnum,
      time,
      type: eventTypes.currencyGiven,
    };
  }

  /** QA variant of Currency Given */
  public constructQACurrencyGiven(event: ICurrencyGivenDBData): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: event.time,
      parameters: {
        given_amount: event.given_amount,
        given_currency: event.given_currency,
      },
      seqnum: event.seqnum,
      type: event.type,
    };

    return this.constructQAWrappedEvent(logDetails);
  }

  /** QA only events */
  public constructQANotificationEngagedEvent(event: IEventDBData, campaignId: number, deeplink: string): IQAWrappedEvent {
    const logDetails: IQAEventLogDetails = {
      client_time: event.time,
      parameters: {
        campaign_id: campaignId,
        payload: {
          deeplink,
        },
      },
      seqnum: event.seqnum,
      type: event.type,
    };

    return {
      log_details: logDetails,
      log_source: 'sdk',
      log_type: 'push-engaged',
      seqnum: logDetails.seqnum,
      time: logDetails.client_time,
      type: 'qa_log_event',
    };
  }

  public constructQAWrappedEvent(logDetails: IQAEventLogDetails): IQAWrappedEvent {
    return {
      log_details: logDetails,
      log_source: 'sdk',
      log_type: 'event',
      seqnum: logDetails.seqnum,
      time: logDetails.client_time,
      type: 'qa_log_event',
    };
  }
}

export default EventFactory;
