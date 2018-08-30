/** Console messages config */
export const messageConfig: {
  title: string;
  types: {
    info: string;
    warn: string;
    error: string;
  }
} = {
  title: 'Swrve WebSDK',
  types: {
    error: 'Error',
    info: 'Info',
    warn: 'Warning',
  },
};

export const webWorkerDbName: string = 'SwrveWebWorkerDB';
export const swrveDefaultDBName: string = 'SwrveWebSDK';
export const swrveDefaultDBVersion: number = 1;

/** Swrve Event Schema Version */
export const swrveVersion: number = 3;

/** Default flush config params */
export const defaultFlushFrequency: number = 60 * 1000;
export const defaultFlushRefreshDelay: number = 5 * 1000;
