import type { Options } from "./options";

import unplugin from ".";

export default (options: Options): any => ({
	name: "unplugin-jsx-source",
	hooks: {
		"astro:config:setup": async (astro: any) => {
			astro.config.vite.plugins ||= [];
			astro.config.vite.plugins.push(unplugin.vite(options));
		},
	},
});
