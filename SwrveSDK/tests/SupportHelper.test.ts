import {
  browserBlackList,
  osBlackList,
} from "../src/helpers/ClientInfoConstants";
import ClientInfoHelper from "../src/helpers/ClientInfoHelper";
import SupportHelper from "../src/helpers/SupportHelper";

describe("SupportHelper", () => {
  describe("isTrackingSupported", () => {
    it("will exist", () => {
      expect(SupportHelper.isTrackingSupported).toBeDefined();
    });

    it("will reject null browser info", () => {
      jest
        .spyOn(ClientInfoHelper, "getBrowserInfo")
        .mockReturnValue({ name: null, version: null });
      expect(SupportHelper.isTrackingSupported()).toEqual(false);
    });

    it("will reject a bad OS", () => {
      jest
        .spyOn(ClientInfoHelper, "getOS")
        .mockReturnValue({ name: osBlackList[0], version: "0" });
      expect(SupportHelper.isTrackingSupported()).toEqual(false);
    });

    it("will reject a bad Browser", () => {
      jest
        .spyOn(ClientInfoHelper, "getBrowserInfo")
        .mockReturnValue({ name: browserBlackList[0], version: "0" });
      expect(SupportHelper.isTrackingSupported()).toEqual(false);
    });

    it("will accept the right Browser", () => { 
      jest.spyOn(ClientInfoHelper, "getBrowserInfo").mockReturnValue({ name: "Chrome", version: "0" });
      jest.spyOn(ClientInfoHelper, "getOS").mockReturnValue({ name: "Mac OSX", version: "0" });
      expect(SupportHelper.isTrackingSupported()).toEqual(true);
    });
  });
});
