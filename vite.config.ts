import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

const execFileAsync = promisify(execFile);
const readmePath = resolve("README.md");
const documentationGeneratorPath = resolve(
  "scripts/generate-user-documentation.mjs",
);

function userDocumentationPlugin(): Plugin {
  return {
    name: "user-documentation-generator",
    configureServer(server) {
      server.watcher.add(readmePath);
    },
    async handleHotUpdate({ file, server }) {
      if (resolve(file) !== readmePath) return;

      await execFileAsync(process.execPath, [documentationGeneratorPath]);
      server.ws.send({ type: "full-reload", path: "/documentazione.html" });
      return [];
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "./",
  plugins: [react(), userDocumentationPlugin()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    reporters: ["default"],
  },
});
