import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: [
			"stacks/**/*.test.ts",
			"stacks/**/*.test.js",
			"stacks/**/*.test.mjs",
			"modules/**/*.test.ts",
			"modules/**/*.test.js",
			"modules/**/*.test.mjs",
		],
		exclude: ["**/node_modules/**", ".terraform"],
		deps: {
			interopDefault: false,
		},
	},
});
