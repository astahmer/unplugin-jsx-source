import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

import type { UnpluginFactory } from 'unplugin'
import { createFilter } from 'unplugin-utils'
import { createUnplugin } from 'unplugin'
import { resolveOption,Options } from './options';

// @ts-expect-error
const traverse = (_traverse.default || _traverse) as any as typeof _traverse;
// @ts-expect-error
const generate = (_generate.default || _generate) as any as typeof _generate;


export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const opt = resolveOption(options)
  const filter = createFilter(opt.include, opt.exclude)

  return ({
    name: 'unplugin-jsx-source',
    enforce: opt.enforce,
    transformInclude(id) {
      return filter(id)
    },
    transform(code, id) {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        ...opt.parserOptions,
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

      const { code: transformedCode } = generate(ast, { filename: id }, code);

      return {
        code: transformedCode,
        map: null,
      };
    },
  });
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
