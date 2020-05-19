import {
	newTestPage,
	click,
	waitForAttribute,
	clickNestedText,
} from "../../../test-utils";
import { expect } from "chai";
import { closePage } from "pentf/browser_utils";
import { getFlameNodes } from "./utils";

export const description = "Focus nodes in flamegraph layout";

export async function run(config: any) {
	const { page, devtools } = await newTestPage(config, "profiler-3");

	await click(devtools, '[name="root-panel"][value="PROFILER"]');

	const recordBtn = '[data-testid="record-btn"]';
	await click(devtools, recordBtn);

	await waitForAttribute(devtools, recordBtn, "title", /Stop Recording/);

	await click(page, "button");
	await click(page, "button");

	await click(devtools, recordBtn);

	// Initially only the top node should be focused.
	expect(await getFlameNodes(devtools)).to.deep.equal([
		{ maximized: true, name: "Fragment", visible: true },
		{ maximized: false, name: "Foo", visible: true },
		{ maximized: false, name: "Counter", visible: true },
		{ maximized: false, name: "Display", visible: true },
		{ maximized: false, name: "Value", visible: true },
	]);

	// Focus 2nd node manually
	await clickNestedText(devtools, "Counter");
	expect(await getFlameNodes(devtools)).to.deep.equal([
		{ maximized: true, name: "Fragment", visible: true },
		{ maximized: true, name: "Foo", visible: true },
		{ maximized: true, name: "Counter", visible: true },
		{ maximized: false, name: "Display", visible: true },
		{ maximized: false, name: "Value", visible: true },
	]);

	// Focus 1st node again
	await clickNestedText(devtools, "Fragment");
	expect(await getFlameNodes(devtools)).to.deep.equal([
		{ maximized: true, name: "Fragment", visible: true },
		{ maximized: false, name: "Foo", visible: true },
		{ maximized: false, name: "Counter", visible: true },
		{ maximized: false, name: "Display", visible: true },
		{ maximized: false, name: "Value", visible: true },
	]);

	await closePage(page);
}