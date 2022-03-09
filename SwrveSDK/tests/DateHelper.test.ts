import DateHelper from '../src/helpers/DateHelper';
import { nowInUtcTime } from '../src/util/Date';

describe('Date', () => {
  describe('nowInUtcTime', () => {
    it('should call DateHelper dateToUTCDate', () => {
      const currentTime = DateHelper.dateToUTCDate(new Date()).getTime();
      expect(nowInUtcTime()).toEqual(currentTime);
    });

    it('should consider timezones', () => {
      const now = Date.parse("2018-08-27T00:00:00.000+00:00");
      const nowInUtc = new Date(Date.parse("2018-08-27T00:00:00.000+09:00"));

      jest.spyOn(Date, 'now').mockReturnValue(now);
      jest.spyOn(Date, 'UTC').mockReturnValue(nowInUtc.getTime());

      expect(now).toBe(Date.now())
      expect(nowInUtcTime()).not.toBe(Date.now())
      expect(nowInUtcTime()).toBe(nowInUtc.getTime());
    })
  });
});