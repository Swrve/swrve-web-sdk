import { IRESTResponse } from '../interfaces/IRESTClient';
import { ISwrveProfile } from '../interfaces/ISwrveProfile';
import RESTClient from '../networking/RESTClient';
import LocalStorageClient from '../storage/LocalStorageClient';
import Swrve from '../Swrve';
import { isNil } from '../util/Nil';
import SwrveLogger from '../util/SwrveLogger';
import { generateUuid } from '../util/Uuid';

/**
 * SwrveProfile
 * Manager which returns information from the Local Storage about the externalUserId passed in
 */

class SwrveProfile {

  private externalUserId: string;
  private userId: string;
  private firstSession: number; /** stored in ms */
  private lastSession: number; /** stored in ms */
  private seqnum: number;
  private etag: string;
  private isQA: boolean;
  private isIdentityResolved;

  public get ExternalUserId(): string {
    return this.externalUserId;
  }

  public get UserId(): string {
    return this.userId;
  }

  public get FirstSession(): number {
    return this.firstSession;
  }

  public get LastSession(): number {
    return this.lastSession;
  }

  public get Seqnum(): number {
    return this.seqnum;
  }

  public get Etag(): string {
    return this.etag;
  }

  public get IsQA(): boolean {
    return this.isQA;
  }

  public get IsIdentityResolved(): boolean {
    return this.isIdentityResolved;
  }

  public constructor(externalUserId: string) {
    let canditateProfile: ISwrveProfile = null;

    /** until we find something stored around the externalUserId, this doesn't exist */
    const storedProfile: ISwrveProfile = this.getSwrveProfileFromExternalUserId(externalUserId);

    if (storedProfile != null && storedProfile !== undefined) {
      canditateProfile = storedProfile;

      /** New or Old: set the properties of the object */
      this.externalUserId = canditateProfile.extUserId;
      this.userId = canditateProfile.userId;
      this.firstSession = canditateProfile.firstSession;
      this.lastSession = canditateProfile.lastSession;
      this.seqnum = canditateProfile.seqnum;
      this.isQA = canditateProfile.qa;

      if (canditateProfile.etag) {
        this.etag = canditateProfile.etag;
      }

      this.isIdentityResolved = true;

    } else {
      SwrveLogger.infoMsg('No Profile Found In Storage. Calling identify API');
      this.isIdentityResolved = false;
    }
  }

  /** called from Swrve.ts if we need to call identify */
  public async callIdentifyOnExternalUserId(externalUserId: string, session: Swrve) {

    const canditateSwrveId = generateUuid().toString();

    try {
      const response: IRESTResponse = await RESTClient.post(session.Config.IdentifyURL, { api_key: session.Config.ApiKey, swrve_id: canditateSwrveId, external_user_id: externalUserId, unique_device_id: session.DeviceId });
      if (response.jsonBody !== undefined && response.statusCode === 200) {
        const responseJSON = JSON.parse(response.jsonBody);
        /** construct ISwrveProfile to save it */
        const newProfile: ISwrveProfile = {
          extUserId: externalUserId,
          firstSession: Date.now(),
          qa: false,
          seqnum: 0,
          userId: responseJSON.swrve_id,
        };

        /** Now Resolved, so set the properties of the object */
        this.externalUserId = newProfile.extUserId;
        this.userId = newProfile.userId;
        this.firstSession = newProfile.firstSession;
        this.lastSession = newProfile.lastSession;
        this.seqnum = newProfile.seqnum;
        this.isQA = newProfile.qa;

        /** turn flag off */
        this.isIdentityResolved = true;
        this.saveSwrveProfileToStorage(newProfile);

      } else {
        const suffixMessage = isNil(response.jsonBody) ? 'with no message.' : ` message: ${response.jsonBody}`;
        SwrveLogger.errorMsg(`Identify failed: ${response.statusCode} :: ${suffixMessage}`);
      }
    } catch (error) { SwrveLogger.errorMsg(error); }
  }

  public setEtag(etag: string): void {
    this.etag = etag;
  }

  public setQAFlag(qa: boolean): void {
    this.isQA = qa;
  }

  public getSwrveProfileFromExternalUserId(externalUserId: string): ISwrveProfile {
    /** create profile object from checking the DB for a row with external User Id */
    try {
      const data: ISwrveProfile = SwrveProfile.getSwrveProfileFromStorage(externalUserId);
      if (!isNil(data) && this.isValidResultProfile(data)) {
        SwrveLogger.infoMsg(`Received from Storage: ${data.userId} | ${data.extUserId} | ${data.seqnum} | ${data.firstSession} | ${data.lastSession} | ${data.etag}`);
        return data;
      }
      return null;

    } catch (error) {
      SwrveLogger.errorMsg(error);
      return null;
    }
  }

  /** data model interaction */

  /** update the seqnum for a given Profile */
  public updateSeqnum(): number {
    this.seqnum = this.seqnum + 1;
    return this.seqnum;
  }

  public saveBeforeSessionEnd(): void {
    /** set the lastSession time just before we finish up */
    this.lastSession = Date.now();

    /** package into a model needed */
    const toStore: ISwrveProfile = {
      extUserId: this.externalUserId,
      firstSession: this.firstSession,
      lastSession: this.lastSession,
      qa: this.isQA,
      seqnum: this.seqnum,
      userId: this.userId,
    };

    if (this.etag) {
      toStore.etag = this.etag;
    }

    this.saveSwrveProfileToStorage(toStore);
  }

  public static getSwrveProfileFromStorage(extUserId: string): ISwrveProfile {
    const localStorageClient = new LocalStorageClient();
    const userId = localStorageClient.fetchUserID(extUserId);
    return {
      etag: localStorageClient.fetchLastETag(userId),
      extUserId,
      firstSession: localStorageClient.fetchFirstSession(userId),
      lastSession: localStorageClient.fetchLastSession(userId),
      qa: localStorageClient.fetchQAStatus(userId),
      seqnum: localStorageClient.fetchSeqnum(userId),
      userId,
    };
  }

  private saveSwrveProfileToStorage(profile: ISwrveProfile): void {
    const localStorageClient = new LocalStorageClient();
    localStorageClient.storeUserID(profile.extUserId, profile.userId);
    localStorageClient.storeSeqnum(profile.userId, profile.seqnum);
    localStorageClient.storeFirstSession(profile.userId, profile.firstSession);
    localStorageClient.storeQAStatus(profile.userId, profile.qa);

    /** optionals */
    if (profile.lastSession) {
      localStorageClient.storeLastSession(profile.userId, profile.lastSession);
    }

    if (profile.etag) {
      localStorageClient.storeLastETag(profile.userId, profile.etag);
    }
  }

  private isValidResultProfile(profileData: ISwrveProfile): boolean {
    /** a valid profile from storage should have the following fields set */
    if (!isNil(profileData.userId) && !isNil(profileData.extUserId) && !isNil(profileData.firstSession) && !isNil(profileData.seqnum)) {
      return true;
    }
    return false;
  }
}

export default SwrveProfile;
