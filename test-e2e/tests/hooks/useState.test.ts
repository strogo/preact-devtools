import { newTestPage, click } from "../../test-utils";
import { expect } from "chai";
import {
	assertNotSelector,
	clickNestedText,
	getAttribute,
	getText,
} from "pentf/browser_utils";

export const description = "Inspect useState hook";

export async function run(config: any) {
	const { page, devtools } = await newTestPage(config, "hooks");

	const hooksPanel = '[data-testid="props-row"]';

	// State update
	await clickNestedText(devtools, "Counter");
	await devtools.waitForSelector(hooksPanel);

	const name = await getText(devtools, '[data-testid="prop-name"]');
	const value = await getAttribute(
		devtools,
		'[data-testid="prop-value"] input',
		"value",
	);

	expect(name).to.equal("useState");
	expect(value).to.equal("0");

	// Should not be collapsable
	await assertNotSelector(devtools, '[data-testid="props-row"] > button');

	// Should be editable
	await devtools.waitFor('[data-testid="prop-value"] input');
	await click(devtools, '[data-testid="prop-value"] input');
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Enter");

	const text = await getText(page, '[data-testid="result"]');
	expect(text).to.equal("Counter: 1");
}
