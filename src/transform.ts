import type {
	Function as FunctionNode,
	JSXIdentifier,
	JSXOpeningElement,
	Node,
} from "@oxc-project/types";
import type { OptionsResolved, SourceLocation } from "./options";
import MagicString from "magic-string";
import { parseSync, visitorKeys } from "oxc-parser";

/** Strip `?query` (Vite virtual modules, TanStack Router `?tsr-split=…`, etc.) before extension checks. */
function cleanModuleId(id: string): string {
	const q = id.indexOf("?");
	return q === -1 ? id : id.slice(0, q);
}

function langFromId(id: string): "js" | "jsx" | "ts" | "tsx" {
	const path = cleanModuleId(id);
	if (path.endsWith(".tsx")) return "tsx";
	if (path.endsWith(".ts")) return "ts";
	if (path.endsWith(".jsx")) return "jsx";
	return "js";
}

/** 1-based line, 0-based column (aligned with Babel `loc` usage in this project). */
function offsetToLocation(
	source: string,
	offset: number,
): { line: number; column: number } {
	let line = 1;
	let lineStart = 0;
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source[i] === "\n") {
			line++;
			lineStart = i + 1;
		}
	}
	return { line, column: offset - lineStart };
}

function spanToSourceLocation(
	source: string,
	start: number,
	end: number,
): SourceLocation {
	return {
		start: offsetToLocation(source, start),
		end: offsetToLocation(source, end),
	};
}

function isJsxIdentifierName(
	name: JSXOpeningElement["name"],
): name is JSXIdentifier {
	return name.type === "JSXIdentifier";
}

function attrNameMatches(
	attr: JSXOpeningElement["attributes"][number],
	name: string,
): boolean {
	return (
		attr.type === "JSXAttribute" &&
		attr.name.type === "JSXIdentifier" &&
		attr.name.name === name
	);
}

function findEnclosingComponentName(ancestors: Node[]): string | null {
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const n = ancestors[i];
		if (n.type === "VariableDeclarator") {
			if (n.id.type === "Identifier") return n.id.name;
		}
		if (n.type === "FunctionDeclaration") {
			const fn = n as FunctionNode;
			if (fn.id?.type === "Identifier") return fn.id.name;
		}
	}
	return null;
}

function walkAst(
	node: Node,
	ancestors: Node[],
	visit: (node: JSXOpeningElement, ancestors: Node[]) => void,
): void {
	if (node.type === "JSXOpeningElement") {
		visit(node, ancestors);
	}
	const keys = visitorKeys[node.type];
	if (!keys) return;
	const nextAncestors = [...ancestors, node];
	for (const key of keys) {
		const child = (node as unknown as Record<string, unknown>)[key];
		if (child == null) continue;
		if (Array.isArray(child)) {
			for (const item of child) {
				if (item && typeof item === "object" && "type" in item) {
					walkAst(item as Node, nextAncestors, visit);
				}
			}
		} else if (typeof child === "object" && "type" in child) {
			walkAst(child as Node, nextAncestors, visit);
		}
	}
}

/**
 * Offset where injected attributes should be inserted (text is spliced *before* this index).
 * - Self-closing `<Foo />`: insert before `/` so we get `<Foo data-… />`, not `<Foo / data-…>`.
 * - Normal `<Foo …>`: insert before the closing `>`.
 */
function jsxOpeningInsertOffset(code: string, path: JSXOpeningElement): number {
	const segment = code.slice(path.start, path.end);
	if (segment.endsWith("/>")) {
		return path.end - 2;
	}
	const i = path.end - 1;
	if (i < path.start || code[i] !== ">") {
		throw new Error(
			`unplugin-jsx-source: could not find closing ">" for JSX opening element`,
		);
	}
	return i;
}

function fmtAttr(name: string, value: string): string {
	return ` ${name}=${JSON.stringify(value)}`;
}

export function transform(
	code: string,
	id: string,
	opt: OptionsResolved,
) {
	const parseId = cleanModuleId(id);
	const lang = opt.parserOptions.lang ?? langFromId(parseId);
	const result = parseSync(parseId, code, {
		sourceType: "module",
		lang,
		...opt.parserOptions,
	});

	if (result.errors.length > 0) {
		const messages = result.errors.map((e) => e.message).join("\n");
		throw new Error(`oxc parse failed for ${parseId}:\n${messages}`);
	}

	const { program } = result;

	const { at: attrAt, in: attrIn, kind: attrKind } = opt.attributes;

	const inserts: { offset: number; text: string }[] = [];

	walkAst(program, [], (path, ancestors) => {
		if (!isJsxIdentifierName(path.name)) return;

		const tag = path.name.name;
		if (tag === "Fragment") return;

		const isComponent = tag[0] === tag[0].toUpperCase();

		const hasSpreadProps = path.attributes.some(
			(attr) => attr.type === "JSXSpreadAttribute",
		);

		const parts: string[] = [];

		if (
			attrAt &&
			!path.attributes.some((a) => attrNameMatches(a, attrAt)) &&
			!hasSpreadProps
		) {
			const loc = spanToSourceLocation(code, path.start, path.end);
			const fileName = opt.transformFileName(parseId, loc);
			parts.push(fmtAttr(attrAt, fileName));
		}

		if (
			attrIn &&
			!path.attributes.some((a) => attrNameMatches(a, attrIn)) &&
			!hasSpreadProps
		) {
			const enclosing = findEnclosingComponentName(ancestors);
			if (enclosing) {
				parts.push(fmtAttr(attrIn, enclosing));
			}
		}

		if (
			attrKind &&
			!path.attributes.some((a) => attrNameMatches(a, attrKind)) &&
			isComponent
		) {
			parts.push(fmtAttr(attrKind, tag));
		}

		if (parts.length === 0) return;

		const offset = jsxOpeningInsertOffset(code, path);
		inserts.push({ offset, text: parts.join("") });
	});

	inserts.sort((a, b) => b.offset - a.offset);
	const s = new MagicString(code);
	for (const { offset, text } of inserts) {
		s.appendLeft(offset, text);
	}

	return {
		code: s.toString(),
		map: s.generateMap({ source: parseId, hires: true, includeContent: true }),
	};
}
