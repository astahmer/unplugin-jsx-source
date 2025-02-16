import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'

// @ts-expect-error
const traverse = (_traverse.default || _traverse) as any as typeof _traverse;
// @ts-expect-error
const generate = (_generate.default || _generate) as any as typeof _generate;


export const unpluginFactory: UnpluginFactory<Options | undefined> = options => ({
  name: 'unplugin-jsx-source',
  transformInclude(id) {
    return id.endsWith('main.ts')
  },
  transform(code, id) {
    if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) {
      return null;
    }

    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    traverse(ast, {
      JSXOpeningElement(path) {
        if (path.node.name.type === "JSXIdentifier" && path.node.loc) {
          const filename = id.split('/').pop();

          // Add `data-at` attribute with filename and location
          const dataAtAttr = t.jsxAttribute(
            t.jsxIdentifier('data-at'),
            t.stringLiteral(`${filename}:${path.node.loc.start.line}-${path.node.loc.end.line}`)
          );

          path.node.attributes.unshift(dataAtAttr);
        }
      },
    });

    const { code: transformedCode } = generate(ast, { filename: id}, code);

    return {
      code: transformedCode,
      map: null,
    };
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
