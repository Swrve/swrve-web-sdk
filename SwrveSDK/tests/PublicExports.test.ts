import {
  ISwrveMessageButtonDetails,
  ISwrveMessageDetails,
  OnSwrveInAppMessageListener,
  SwrveMessageAction,
} from "../src/index";

describe("PUBLIC EXPORTS", () => {
  it("re-exports the in-app message action values from the package entry point", () => {
    expect(SwrveMessageAction.Impression).toBe("impression");
    expect(SwrveMessageAction.Custom).toBe("custom");
    expect(SwrveMessageAction.Dismiss).toBe("dismiss");
  });

  it("re-exports the in-app message listener types from the package entry point", () => {
    /* Type-only exports have no runtime presence, so referencing them in type
     * positions is what proves they are importable from the entry point. */
    const received: Array<[SwrveMessageAction, ISwrveMessageDetails, ISwrveMessageButtonDetails | undefined]> = [];

    const listener: OnSwrveInAppMessageListener = (
      action,
      messageDetails,
      selectedButton
    ) => {
      received.push([action, messageDetails, selectedButton]);
    };

    const details: ISwrveMessageDetails = {
      campaignId: 298948,
      variantId: 301432,
      messageName: "OTT_DEMO",
    };
    const button: ISwrveMessageButtonDetails = {
      buttonName: "Button One",
      actionType: "CUSTOM",
      actionString: "https://www.google.com",
    };

    listener(SwrveMessageAction.Impression, details);
    listener(SwrveMessageAction.Custom, details, button);

    expect(received.length).toBe(2);
    expect(received[0][2]).toBeUndefined();
    expect(received[1][2]!.buttonName).toBe("Button One");
  });
});
