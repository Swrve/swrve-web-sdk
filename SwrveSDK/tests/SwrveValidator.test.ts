import SwrveValidator from '../src/helpers/SwrveValidator';
import { ISwrveSDKConfig } from '../src/interfaces/ISwrveSDKConfig';
import { IValidateError } from '../src/interfaces/ISwrveValidator';

describe('In SwrveValidator object,', () => {
  describe('method validateUserID', () => {

    it('should check if given parameter is a string', () => {
      expect(SwrveValidator.validateExternalUserId(123 as any)[0])
        .toBe('externalUserId should be a string');
    });
  });

  describe('method validateAppId', () => {

    it('should check if given parameter exists', () => {
      expect(SwrveValidator.validateAppId(undefined)[0])
        .toBe('appId doesn\'t exist');
    }),

    it('should check if given parameter is a number', () => {
      expect(SwrveValidator.validateAppId('bob' as any)[0])
        .toBe('appId should be a number');
    });

  });

  describe('method validateApiKey', () => {

    it('should check if given parameter exists', () => {
      expect(SwrveValidator.validateApiKey(undefined)[0])
        .toBe('apiKey doesn\'t exist');
    }),

    it('should check if given parameter is a string', () => {
      expect(SwrveValidator.validateApiKey(123 as any)[0])
        .toBe('apiKey should be a string');
    });

    it('will check if given parameter is a valid apikey', () => {
      expect(SwrveValidator.validateApiKey('fasdfadsgasdfads' as string)[0])
        .toBe('apiKey should be a valid web_sdk api key');
    });
  });

  describe('method validateContentUrl', () => {

    it('should check if given parameter is a string', () => {
      expect(SwrveValidator.validateContentUrl(123 as any)[0])
        .toBe('contentURL should be a string');
    }),

    it('should check if given parameter is a valid URL', () => {
      expect(SwrveValidator.validateContentUrl('asd123123adxx///..')[0])
        .toBe('contentURL isn\'t valid URL');
    });
  });

  describe('method validateEventsUrl', () => {

    it('should check if given parameter is a string', () => {
      expect(SwrveValidator.validateEventsUrl(123 as any)[0])
        .toBe('eventsUrl should be a string');
    }),

    it('should check if given parameter is a valid URL', () => {
      expect(SwrveValidator.validateEventsUrl('asd123123adxx///..')[0])
        .toBe('eventsUrl isn\'t a valid URL');
    });
  });

  describe('method validateVersion', () => {

    it('should check if given parameter is a string', () => {
      expect(SwrveValidator.validateVersion(123 as any)[0])
        .toBe('version should be a string');
    }),

    it('should check if given parameter is a valid URL', () => {
      expect(SwrveValidator.validateVersion('asd123123adxx///..')[0])
        .toBe('version isn\'t valid');
    });
  });

  describe('method validateSessionTimeout', () => {

    it('should check if given parameter is a number', () => {
      expect(SwrveValidator.validateSessionTimeout('string' as any)[0])
        .toBe('sessionTimeout should be a number');
    }),

    it('should check if given parameter is a valid URL', () => {
      expect(SwrveValidator.validateSessionTimeout(-1)[0])
        .toBe('sessionTimeout should be positive integer or 0');
    });
  });

  describe('method validateInitParams', () => {

    it('should return error object if initial parameters are incorrect', () => {
      const wrongInitParams: ISwrveSDKConfig = {
        apiKey: 'fhgjcwqqq7oZKj4CX8x',
        eventsUrl: 'string',
        contentUrl: 'string',
        appId: 123,
        appVersion: 'string',
        externalUserId: 'string',
        httpsTimeoutSeconds: 12,
      };

      const errors: IValidateError | void = SwrveValidator.validateInitParams(wrongInitParams);

      expect(errors).toBeDefined();
      expect((errors as IValidateError).mainError).toBe('Initial configuration parameters are incorrect');
      expect((errors as IValidateError).devErrors.length).toBeTruthy();
    });

    it('should return undefined if initial parameters are correct', () => {
      const correctInitParams: ISwrveSDKConfig = {
        apiKey: 'web_sdk-fhgjcwqqq7oZKj4CX8x',
        eventsUrl: 'https://eu-api.swrve.com',
        contentUrl: 'https://api.swrve.com',
        appId: 1234,
        appVersion: '1.0.0',
        externalUserId: 'bcjoO12345JN6g0EkA6',
        httpsTimeoutSeconds: 30000,
      };

      const errors: IValidateError | void = SwrveValidator.validateInitParams(correctInitParams);
      expect(errors).toBeUndefined();
    });

  });
});
