import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import Unplugin from "../src/vite";

export default defineConfig({
	plugins: [
		Inspect(),
		Unplugin({
			attributes: {
				at: "data-source",
			}
		}),
		react(),
	],
});
