import ClientInfoHelper from "../src/helpers/ClientInfoHelper";

  describe("ClientInfoHelper", () => {

    describe('getOS()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getOS).toBeDefined();
      });
  
      it('will return a valid os', () => {
        // Mock an OSX instance
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
        const os = ClientInfoHelper.getOS();
        expect(os.name).toBeDefined();
        expect(os.version).toBeDefined();
        expect(typeof os.name).toEqual('string');
        expect(typeof os.version).toEqual('string');
      });
    });
  
    describe('getDeviceName()', () => {
      it('will return the combined device information', () => {
        const deviceName = ClientInfoHelper.getDeviceName();
        expect(deviceName).toContain(ClientInfoHelper.getOS().name);
        expect(deviceName).toContain(ClientInfoHelper.getBrowserInfo().name);
        expect(deviceName).toContain(ClientInfoHelper.getBrowserInfo().version);
      });
    });
  
    describe('getDeviceType()', () => {
      it('will return "mobile" on finding a mobile browser', () => {
        /** Mock UserAgent to spoof mobile */
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('mobile');
  
        const deviceType = ClientInfoHelper.getDeviceType();
        expect(deviceType).toEqual('mobile'); 
      });
  
      it('will return "desktop" on finding a desktop browser', () => {
        /** Mock UserAgent to spoof desktop */
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('safari');

        const deviceType = ClientInfoHelper.getDeviceType();
        expect(deviceType).toEqual('desktop');
      });
    });
  
    describe('getScreenResolution()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getScreenResolution).toBeDefined();
      });
  
      it('will return numeric result', () => {
        jest.spyOn(window.screen, 'availHeight', 'get').mockReturnValue(100);
        jest.spyOn(window.screen, 'availWidth', 'get').mockReturnValue(100);

        const res = ClientInfoHelper.getScreenResolution();

        expect(typeof res.width).toEqual('string');
        expect(parseInt(res.width, 10)).toBe(100);
        expect(typeof res.height).toEqual('string');
        expect(parseInt(res.height, 10)).toBe(100);
      });
    });
  
    describe('getBrowserLanguage()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getBrowserLanguage).toBeDefined();
      });
  
      it('will return a string language', () => {
        expect([ 'en-IE', 'en-US', 'en-GB', 'en-ie', 'en-us', 'en-gb' ]).toContain(ClientInfoHelper.getBrowserLanguage());
      });
    });
  
    describe('getUTCOffsetSeconds()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getUTCOffsetSeconds).toBeDefined();
      });
  
      it('will return positive number for offset', () => {
        jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-60);
        expect(ClientInfoHelper.getUTCOffsetSeconds(new Date())).toEqual(3600);
      });
  
      it('will return unsigned 0 timezone offset', () => {
        jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
        expect(ClientInfoHelper.getUTCOffsetSeconds(new Date())).toEqual(0);
      });
  
      it('will return negative number for offset', () => {
        jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(60);
        expect(ClientInfoHelper.getUTCOffsetSeconds(new Date())).toEqual(-3600);
      });
    });
  
    describe('getCountryCode()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getCountryCode).toBeDefined();
      });
  
      it('will return the correct country code', () => {
        expect(ClientInfoHelper.getCountryCode()).toEqual('Unknown');
      });
    });
  
    describe('getRegion()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getRegion).toBeDefined();
      });
  
      it('will return the correct country code', () => {
        expect(ClientInfoHelper.getRegion()).toEqual('Unknown');
      });
    });
  
    describe('getTimezoneName()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getTimezoneName).toBeDefined();
      });
  
      it('will return a properly localized name', () => {
        const timezone = ClientInfoHelper.getTimezoneName();
        if (timezone != "UTC") {
          /** Regex to look for any two groups of characters delimited by '/' */
          const regex = new RegExp('[A-z].*./.[A-z].*');
          expect(timezone).toMatch(regex);
        }
      });
    });
  
    describe('getBrowserInfo()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getBrowserInfo).toBeDefined();
      });
  
      it('will return "firefox" for name for a firefox userAgent type', () => {
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:81.0) Gecko/20100101 Firefox/81.0');
        const info = ClientInfoHelper.getBrowserInfo();
        expect(info.name).toEqual('firefox');
        expect(info.version).toEqual('81.0');
      });
  
      it('will return "safari" for name for a safari userAgent type', () => {
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15');
        const info = ClientInfoHelper.getBrowserInfo();
        expect(info.name).toEqual('safari');
        expect(info.version).toEqual('14.0');
      });
  
      it('will return "chrome" for name for a chrome userAgent type', () => {
        jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
        const info = ClientInfoHelper.getBrowserInfo();
        expect(info.name).toEqual('chrome');
        expect(info.version).toEqual('85.0.4183.121');
      });
  
      it('will return a properly localized name', () => {
        const timezone = ClientInfoHelper.getTimezoneName();
        if (timezone != "UTC") {
          /** Regex to look for any two groups of characters delimited by '/' */
          const regex = new RegExp('[A-z].*./.[A-z].*');
          expect(timezone).toMatch(regex);
        }
      });
    });
  
    describe('getClientInfo()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getClientInfo).toBeDefined();
      });
    });
  
    describe('getSDKVersion()', () => {
      it('will exist', () => {
        expect(ClientInfoHelper.getSDKVersion).toBeDefined();
      });
  
      it('will return the correct SDK version', () => {
        const version = ClientInfoHelper.getSDKVersion();
        expect(version).toBeDefined();
        expect(version).toEqual('Web 2.0.1');
      });
    });
  });
  
  