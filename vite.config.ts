import { chmod, cp, rename, writeFile } from "node:fs/promises";
import { defineConfig } from "vite";
import packageJson from "./package.json";

const distRegExp = /^(\.\/)?dist\//;
const removeDist = (obj: any): any => {
	if (typeof obj === "string") {
		obj = obj.replace(distRegExp, "$1");
	} else if (typeof obj === "object") {
		if (Array.isArray(obj)) {
			obj = obj.map(removeDist);
		} else {
			obj = Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, removeDist(value)]));
		}
	}
	return obj;
};

const dependencies = new Set(Object.keys(packageJson.dependencies));

// https://vitejs.dev/config/
export default defineConfig({
	ssr: {
		noExternal: true,
	},
	build: {
		ssr: true,
		outDir: "dist",
		lib: {
			entry: {
				main: "./src/main",
				driver: "./src/driver",
				parser: "./src/parser",
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: (id) => id.startsWith("node:") || dependencies.has(id),
			output: {
				banner: (chunk) => (chunk.isEntry && chunk.name === "main" ? "#!/usr/bin/env node\n" : ""),
			},
		},
	},
	plugins: [
		{
			name: "extra",
			async writeBundle() {
				await rename("dist/main.js", "dist/main");
				await chmod("dist/main", 0o755);
				await cp("README.md", "dist/README.md");
				await cp("LICENSE.md", "dist/LICENSE.md");
				const pkg: Partial<typeof packageJson> = { ...packageJson };
				delete pkg.scripts;
				delete pkg.devDependencies;
				delete pkg.private;
				await writeFile("dist/package.json", JSON.stringify(removeDist(pkg)));
			},
		},
	],
});
