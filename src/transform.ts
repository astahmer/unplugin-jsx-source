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
				!path.isJSXFragment()
			) {
				const newAttributes = [] as t.JSXAttribute[];
				if (
					opt.attributes.at &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.at,
					)
				) {
					const fileName = opt.transformFileName(id, path.node.loc);
					const dataAtAttr = t.jsxAttribute(
						t.jsxIdentifier(opt.attributes.at),
						t.stringLiteral(fileName),
					);
					newAttributes.push(dataAtAttr);
				}

				if (
					opt.attributes.in &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.in,
					)
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

				if (
					opt.attributes.kind &&
					!path.node.attributes.some(
						(a) =>
							a.type === "JSXAttribute" && a.name.name === opt.attributes.kind,
					) &&
					path.node.name.name[0].toUpperCase() === path.node.name.name[0]
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
