import DateHelper from '../helpers/DateHelper';
import {
  ActionType,
  CampaignType,
  EventType,
  eventTypes,
  ICurrencyGivenDBData,
  IEventDBData,
  IGenericCampaignEventDBData,
  IPurchaseEventDBData,
} from '../interfaces/IEvents';

class EventFactory {
  public constructEvent(seqnum: number, isQA: boolean, time: number, type: string, name?: string, payload?: object): IEventDBData {
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

  public constructSessionStart(seqnum: number, isQA: boolean, time: number, type: string, name?: string, payload?: object): IEventDBData {
    return this.constructEvent(seqnum, isQA, time, type, name, payload);
  }

    /** User Update */
  public constructUserUpdate(seqnum: number, isQA: boolean, time: number, attributes: object): IEventDBData {
    const requestBody: IEventDBData = {
      attributes,
      seqnum,
      time,
      type: eventTypes.userUpdateEvent,
    };

    return requestBody;
  }

  /** Generic Campaign Event */
  public constructGenericCampaignEvent(seqnum: number, isQA: boolean, time: number, campaignType: CampaignType, campaignId: number, id: number, actionType: ActionType): IGenericCampaignEventDBData {
    const requestBody: IGenericCampaignEventDBData = {
      actionType,
      campaignId,
      campaignType,
      id,
      seqnum,
      time,
      type: eventTypes.genericCampaignEvent,
    };

    return requestBody;
  }

  /** Device Update */
  public constructDeviceUpdate(seqnum: number, isQA: boolean, time: number, attributes: object): IEventDBData {
    const requestBody: IEventDBData = {
      attributes,
      seqnum,
      time,
      type: eventTypes.deviceUpdateEvent as EventType,
    };

    return requestBody;
  }

    /** User Update With Date */
  public constructUserUpdateWithDate(seqnum: number, isQA: boolean, time: number, name: string, date: Date): IEventDBData {
    const utcDate = DateHelper.dateToUTCDate(date);
    const attributes = { name, date: DateHelper.dateToSwrveISOString(utcDate) };
    return this.constructUserUpdate(seqnum, isQA, time, attributes);
  }

    /** Purchase Event */
  public constructPurchaseEvent(seqnum: number, isQA: boolean, time: number, item: string, currency: string, cost: number, quantity: number): IPurchaseEventDBData {
    const requestBody: IPurchaseEventDBData = {
      cost,
      currency,
      item,
      quantity,
      seqnum,
      time,
      type: eventTypes.purchaseEvent as EventType,
    };

    return requestBody;
  }

  /** Currency Given */
  public constructCurrencyGiven(seqnum: number, isQA: boolean, time: number, currency: string, amount: number): ICurrencyGivenDBData {
    const requestBody: ICurrencyGivenDBData = {
      given_amount: amount,
      given_currency: currency,
      seqnum,
      time,
      type: eventTypes.currencyGiven as EventType,
    };

    return requestBody;
  }
}

export default EventFactory;
