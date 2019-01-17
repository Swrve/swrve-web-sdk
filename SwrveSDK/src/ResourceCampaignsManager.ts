import { resourcesCampaignSpecialParams, resourcesCampaignURL } from './config/ApiUrls';
import { defaultFlushFrequency, defaultFlushRefreshDelay, swrveVersion } from './config/AppConfigParams';
import IBackgroundProcessor from './interfaces/IBackgroundProcessor';
import { IInfoForSession, IResourcesCampaignsQueryParams } from './interfaces/IResourcesCampaigns';

import { IFlushConfig } from './interfaces/ISwrveConfig';

import ClientInfoHelper from './helpers/ClientInfoHelper';
import { IRESTResponse } from './interfaces/IRESTClient';
import RESTClient from './networking/RESTClient';
import LocalStorageClient from './storage/LocalStorageClient';
import Swrve from './Swrve';
import { isPresent } from './util/Nil';
import SwrveLogger from './util/SwrveLogger';

class ResourceCampaignsManager implements IBackgroundProcessor {
  public timeoutProcess: number;
  public isProcessing: boolean;
  public lastProcessingStart: number;
  public lastProcessingStop: number;
  private flushConfig: IFlushConfig;

  public init(flushConfig: IFlushConfig) {
    // TODO: Add protection so that only one instance of the manager can be run ORK-256
    this.flushConfig = flushConfig;
    this.processInBackground();
  }

  public async getInfoForSession(): Promise<IInfoForSession | void> {
    const session: Swrve = Swrve.getCurrentInstance();
    const localStorageClient = new LocalStorageClient();
    const hasRefreshDelay = isPresent(localStorageClient.fetchLastFlushRefreshDelay(session.Profile.UserId));

    if (session.Profile.Etag && hasRefreshDelay) {
      /**
       * Due the volatility of browser storage,
       * we need to ensure that if there is an Etag in memory
       * that we definitely have items stored to match it. if not purge Etag
       */
      Swrve.getCurrentInstance().Profile.setEtag(null);
    }

    try {
      const response: IRESTResponse = await this.getResourcesAndCampaigns();
      SwrveLogger.infoMsg(response.jsonBody);

      if (response.jsonBody !== undefined && response.jsonBody !== '{}' && response.statusCode === 200) {
        const responseJSON = JSON.parse(response.jsonBody);
        /** if the response isn't empty. store the responses */
        localStorageClient.storeLastFlushFrequency(session.Profile.UserId, responseJSON.flush_frequency);
        localStorageClient.storeLastFlushRefreshDelay(session.Profile.UserId, responseJSON.flush_refresh_delay);
        localStorageClient.storeQAStatus(session.Profile.UserId, ('qa' in responseJSON));
        localStorageClient.storeLastWebPushPublicKey(session.Profile.UserId, responseJSON.web_push_public_key);

        /** pull the etag from the GET header response */
        if (response.etag) {
          Swrve.getCurrentInstance().Profile.setEtag(response.etag);
        }
      }

      /** return from storage, otherwise, use the defaults */
      return {
        flushFrequency: localStorageClient.fetchLastFlushFrequency(session.Profile.UserId) || defaultFlushFrequency,
        flushRefreshDelay: localStorageClient.fetchLastFlushRefreshDelay(session.Profile.UserId) || defaultFlushRefreshDelay,
        qa: localStorageClient.fetchQAStatus(session.Profile.UserId) || false,
        webPushPublicKey: localStorageClient.fetchLastWebPushPublicKey(session.Profile.UserId) || null,
      };

    } catch (error) {
      SwrveLogger.errorMsg(error);
      /** if anything goes wrong, return defaults */
      return {
        flushFrequency: defaultFlushFrequency,
        flushRefreshDelay: defaultFlushRefreshDelay,
        qa: false,
        webPushPublicKey: null,
      };
    }
  }

  public processInBackground() {
    if (this.isProcessing) {
      // The previous process is still running
      return null;
    }
    this.setAsStarted();
    try {
      this.getResourcesAndCampaigns();
    } catch (err) {
      SwrveLogger.errorMsg('SwrveSDK - An error has occured processing events');
      SwrveLogger.errorMsg(err);
    }
    this.setAsStopped();

    // Do not use setInterval. This is not guaranteed to work
    this.timeoutProcess = window.setTimeout(this.processInBackground.bind(this), this.flushConfig.flushFrequency);
  }

  public shutdown(): void {
    clearTimeout(this.timeoutProcess);
    this.timeoutProcess = undefined;
  }

  public setAsStarted(): void {
    this.isProcessing = true;
    this.lastProcessingStart = Date.now();
  }

  public setAsStopped(): void {
    this.isProcessing = false;
    this.lastProcessingStop = Date.now();
  }

  public resourceAndCampaignRequestUrl(session: Swrve): string {
    const queryParamsBody: IResourcesCampaignsQueryParams = {
      api_key: session.Config.ApiKey,
      app_store: resourcesCampaignSpecialParams.app_store,
      app_version: session.Config.AppVersion || swrveVersion.toString(),
      device_height: ClientInfoHelper.getScreenResolution().height,
      device_name: ClientInfoHelper.getDeviceName(),
      device_width: ClientInfoHelper.getScreenResolution().width,
      joined: session.Profile.FirstSession.toString(),
      language: ClientInfoHelper.getBrowserLanguage(),
      orientation: resourcesCampaignSpecialParams.orientation,
      os: ClientInfoHelper.getOS().name,
      os_version: ClientInfoHelper.getOS().version,
      user: session.Profile.UserId,
      version: resourcesCampaignSpecialParams.version,
    };

    if (session.Profile.Etag) {
      /** add etag to GET params */
      queryParamsBody.etag = session.Profile.Etag;
    }

    const queryParams: string = Object.keys(queryParamsBody).map((key: string) => {
      return `${key}=${queryParamsBody[key]}`;
    }).join('&');
    const sanitizedQueryParams = this.replaceWhitespaces(queryParams, '+');

    return `${session.Config.ContentURL}/${resourcesCampaignURL}?${sanitizedQueryParams}`;
  }

  public async getResourcesAndCampaigns(): Promise<IRESTResponse> {
    const url: string = this.resourceAndCampaignRequestUrl(Swrve.getCurrentInstance());
    return RESTClient.get(url);
  }

  private replaceWhitespaces(str: string, replaceStr: string): string {
    return str.replace(/\s/g, replaceStr);
  }
}

export default ResourceCampaignsManager;
