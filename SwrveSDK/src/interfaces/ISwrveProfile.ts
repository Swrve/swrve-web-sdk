
/** SwrveProfile Parameters */
export interface ISwrveProfile {
  /** UserId (SwrveId) associated with external user Id */
  userId: string;
  /** external user id associated with identify login */
  extUserId: string;
  /** Sequence number associated with the event queue */
  seqnum: number;
  /** Date of first session (milliseconds) */
  firstSession: number;
  /** Date of last time the profile logged in (milliseconds) */
  lastSession?: number;
  /** Etag for device resources updates */
  etag?: string;
  /** IsQA */
  qa: boolean;
}
