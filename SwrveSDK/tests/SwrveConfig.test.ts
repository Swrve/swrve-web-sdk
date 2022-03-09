import SwrveConfig from "../src/config/SwrveConfig";

const externalUserId = `test-user-id-${Math.random()}`;

describe("SwrveConfig", () => {
	it("default values", () => {
		const swrveConfig = new SwrveConfig({
			apiKey: "web_sdk-test_api_key",
			appId: 12345,
			externalUserId
		});
		expect(swrveConfig.ExternalUserId).toBe(externalUserId);
		expect(swrveConfig.AutoPushSubscribe).toBe(false);
		expect(swrveConfig.ServiceWorker).toBe("SwrveWorker.js");
	});
});