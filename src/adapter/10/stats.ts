import { ID, DevNodeType } from "../../view/store/types";
import { MsgTypes } from "../events/events";
import { VNode } from "preact";
import { RendererConfig10, getDevtoolsType } from "./renderer";

export enum DiffType {
	UNKNOWN = 0,
	KEYED = 1,
	UNKEYED = 2,
	MIXED = 3,
}

export function getDiffType(child: VNode, prev: DiffType) {
	if (prev !== DiffType.MIXED) {
		if (child.key != null) {
			return prev === DiffType.UNKNOWN || prev === DiffType.KEYED
				? DiffType.KEYED
				: DiffType.MIXED;
		} else {
			return prev === DiffType.UNKNOWN || prev === DiffType.UNKEYED
				? DiffType.UNKEYED
				: DiffType.MIXED;
		}
	}
	return prev;
}

export interface ComponentStats {
	total: number;
	children: number[];
}

export interface Stats {
	roots: ComponentStats;
	classComponents: ComponentStats;
	functionComponents: ComponentStats;
	fragments: ComponentStats;
	forwardRef: ComponentStats;
	memo: ComponentStats;
	suspense: ComponentStats;
	elements: ComponentStats;
	text: number;
	keyed: ComponentStats;
	unkeyed: ComponentStats;
	mixed: ComponentStats;
	mounts: number;
	updates: number;
	unmounts: number;
}

export function updateDiffStats(
	stats: Stats,
	diff: DiffType,
	childCount: number,
) {
	if (diff === DiffType.KEYED) {
		stats.keyed.total++;
		stats.keyed.children.push(childCount);
	} else if (diff === DiffType.UNKEYED) {
		stats.unkeyed.total++;
		stats.unkeyed.children.push(childCount);
	} else if (diff === DiffType.MIXED) {
		stats.mixed.total++;
		stats.mixed.children.push(childCount);
	}
}

// TODO: store children count
// TODO: store update depth
export function createStats(): Stats {
	return {
		roots: {
			total: 0,
			children: [],
		},
		classComponents: {
			total: 0,
			children: [],
		},
		functionComponents: {
			total: 0,
			children: [],
		},
		fragments: {
			total: 0,
			children: [],
		},
		forwardRef: {
			total: 0,
			children: [],
		},
		memo: {
			total: 0,
			children: [],
		},
		suspense: {
			total: 0,
			children: [],
		},
		elements: {
			total: 0,
			children: [],
		},
		text: 0,
		keyed: {
			total: 0,
			children: [],
		},
		unkeyed: {
			total: 0,
			children: [],
		},
		mixed: {
			total: 0,
			children: [],
		},
		mounts: 0,
		unmounts: 0,
		updates: 0,
	};
}

export function recordComponentStats(
	config: RendererConfig10,
	stats: Stats,
	vnode: VNode,
	childrenLen: number,
) {
	const type = vnode.type;
	if (typeof type === "function") {
		if (type.prototype && type.prototype.render) {
			stats.classComponents.total++;
			stats.classComponents.children.push(childrenLen);
		} else {
			if (type === config.Fragment) {
				stats.fragments.total++;
				stats.fragments.children.push(childrenLen);
			}
		}
	} else if (type !== null) {
		stats.elements.total++;
		stats.elements.children.push(childrenLen);
	} else {
		stats.text++;
	}

	const devType = getDevtoolsType(vnode);
	switch (devType) {
		case DevNodeType.ForwardRef:
			stats.forwardRef.total++;
			stats.forwardRef.children.push(childrenLen);
			break;
		case DevNodeType.Memo:
			stats.memo.total++;
			stats.memo.children.push(childrenLen);
			break;
		case DevNodeType.Suspense:
			stats.suspense.total++;
			stats.suspense.children.push(childrenLen);
			break;
	}
}

export function stats2ops(rootId: ID, stats: Stats): number[] {
	return [
		MsgTypes.COMMIT_STATS,
		rootId,

		stats.roots.total,
		stats.roots.children.length,
		...stats.roots.children,

		stats.classComponents.total,
		stats.classComponents.children.length,
		...stats.classComponents.children,

		stats.functionComponents.total,
		stats.functionComponents.children.length,
		...stats.functionComponents.children,

		stats.fragments.total,
		stats.fragments.children.length,
		...stats.fragments.children,

		stats.forwardRef.total,
		stats.forwardRef.children.length,
		...stats.forwardRef.children,

		stats.memo.total,
		stats.memo.children.length,
		...stats.memo.children,

		stats.suspense.total,
		stats.suspense.children.length,
		...stats.suspense.children,

		stats.elements.total,
		stats.elements.children.length,
		...stats.elements.children,

		stats.text,

		stats.keyed.total,
		stats.keyed.children.length,
		...stats.keyed.children,
		stats.unkeyed.total,
		stats.unkeyed.children.length,
		...stats.unkeyed.children,
		stats.mixed.total,
		stats.mixed.children.length,
		...stats.mixed.children,

		stats.mounts,
		stats.updates,
		stats.unmounts,
	];
}

export interface ParsedComponentStats {
	total: number;
	children: Map<number, number>;
}

export interface ParsedStats {
	roots: ParsedComponentStats;
	classComponents: ParsedComponentStats;
	functionComponents: ParsedComponentStats;
	fragments: ParsedComponentStats;
	forwardRef: ParsedComponentStats;
	memo: ParsedComponentStats;
	suspense: ParsedComponentStats;
	elements: ParsedComponentStats;
	text: number;
	keyed: ParsedComponentStats;
	unkeyed: ParsedComponentStats;
	mixed: ParsedComponentStats;
	mounts: number;
	updates: number;
	unmounts: number;
}

export function parseComponentStats(i: number, ops: number[]) {
	const total = ops[i++];
	const len = ops[i++];
	const children = new Map();

	let j = len;
	while (j--) {
		const value = children.get(ops[i + j]) || 0;
		children.set(ops[i + j], value + 1);
	}

	i += len;

	return {
		i,
		total,
		children,
	};
}

export function parseStats(ops: number[]): ParsedStats {
	let i = 1;
	// const rootId = ops[i++];
	const roots = parseComponentStats(i, ops);
	i = roots.i;

	const klass = parseComponentStats(i, ops);
	i = klass.i;

	const fnComps = parseComponentStats(i, ops);
	i = fnComps.i;

	const fragments = parseComponentStats(i, ops);
	i = fragments.i;

	const forwardRef = parseComponentStats(i, ops);
	i = forwardRef.i;

	const memo = parseComponentStats(i, ops);
	i = memo.i;

	const suspense = parseComponentStats(i, ops);
	i = suspense.i;

	const elements = parseComponentStats(i, ops);
	i = elements.i;

	const text = ops[i++];

	const keyed = parseComponentStats(i, ops);
	i = keyed.i;

	const unkeyed = parseComponentStats(i, ops);
	i = unkeyed.i;

	const mixed = parseComponentStats(i, ops);
	i = mixed.i;

	const mounts = ops[i++];
	const updates = ops[i++];
	const unmounts = ops[i++];

	return {
		roots,
		classComponents: klass,
		functionComponents: fnComps,
		fragments,
		forwardRef,
		memo,
		suspense,
		elements,
		text,

		keyed,
		unkeyed,
		mixed,

		mounts,
		updates,
		unmounts,
	};
}
