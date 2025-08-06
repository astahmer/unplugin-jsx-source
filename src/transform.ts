import { parse } from "@babel/parser";
import _traverse, { type NodePath } from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";
import type { OptionsResolved } from "./options";

// @ts-expect-error
const traverse = (_traverse.default || _traverse) as any as typeof _traverse;
// @ts-expect-error
const generate = (_generate.default || _generate) as any as typeof _generate;

export const transform = (code: string, id: string, opt: OptionsResolved) => {
	const ast = parse(code, {
		sourceType: "module",
		plugins: ["jsx", "typescript"],
		...opt.parserOptions,
	});

	traverse(ast, {
		JSXOpeningElement(path) {
			if (
				path.node.name.type === "JSXIdentifier" &&
				path.node.loc &&
				!path.isJSXFragment() &&
				path.node.name.name !== "Fragment"
			) {
				const isComponent = path.node.name.name[0].toUpperCase() === path.node.name.name[0];

				// Check if this DOM element has spread props that might override data attributes
				const hasSpreadProps = path.node.attributes.some(
					(attr) => attr.type === "JSXSpreadAttribute"
				);

				const newAttributes = [] as t.JSXAttribute[];

				// Only add data-at to components, or DOM elements without spread props
				if (
					opt.attributes.at &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.at,
					) &&
					(!hasSpreadProps)
				) {
					const fileName = opt.transformFileName(id, path.node.loc);
					const dataAtAttr = t.jsxAttribute(
						t.jsxIdentifier(opt.attributes.at),
						t.stringLiteral(fileName),
					);
					newAttributes.push(dataAtAttr);
				}

				// Only add data-in to components, or DOM elements without spread props
				if (
					opt.attributes.in &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.in,
					) &&
					(!hasSpreadProps)
				) {
					const assertHasName = (p: NodePath<t.Node>) =>
						p.isVariableDeclarator() || p.isFunctionDeclaration();
					const parent = path.findParent(assertHasName);

					if (
						parent &&
						assertHasName(parent) &&
						parent.node.id &&
						"name" in parent.node.id
					) {
						const dataInAttr = t.jsxAttribute(
							t.jsxIdentifier(opt.attributes.in),
							t.stringLiteral(parent.node.id.name),
						);
						newAttributes.push(dataInAttr);
					}
				}

				// Only add data-kind to components
				if (
					opt.attributes.kind &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.kind,
					) &&
					isComponent
				) {
					const dataKindAttr = t.jsxAttribute(
						t.jsxIdentifier(opt.attributes.kind),
						t.stringLiteral(path.node.name.name),
					);
					newAttributes.push(dataKindAttr);
				}

				path.node.attributes.push(...newAttributes);
			}
		},
	});

	const { code: transformedCode } = generate(ast, { filename: id }, code);

	return {
		code: transformedCode,
		map: null,
	};
};
