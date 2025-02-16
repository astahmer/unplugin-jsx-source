import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { createFilter } from "unplugin-utils";
import { Options, resolveOption } from "./options";
import { transform } from "./transform";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
	options = {},
) => {
	const opt = resolveOption(options);
	const filter = createFilter(opt.include, opt.exclude);

	return {
		name: "unplugin-jsx-source",
		enforce: opt.enforce,
		transformInclude(id) {
			return filter(id);
		},
		transform(code, id) {
			return transform(code, id, opt);
		},
	};
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
