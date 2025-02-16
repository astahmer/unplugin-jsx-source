import type { Options } from "./options";
import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from "@nuxt/kit";
import vite from "./vite";
import webpack from "./webpack";
import "@nuxt/schema";

export interface ModuleOptions extends Options {}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: "nuxt-unplugin-jsx-source",
		configKey: "unpluginStarter",
	},
	defaults: {
		// ...default options
	},
	setup(options, _nuxt) {
		addVitePlugin(() => vite(options));
		addWebpackPlugin(() => webpack(options));

		// ...
	},
});
