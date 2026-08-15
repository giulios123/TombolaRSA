import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const source = path.join(projectRoot, "data/source/Cartelle-Tabellone.pdf");
const outputDirectory = path.join(projectRoot, "tmp/pdfs/source-pages");
const pageArgumentIndex = process.argv.indexOf("--page");
const page =
  pageArgumentIndex >= 0 ? process.argv[pageArgumentIndex + 1] : undefined;

if (!page || !/^\d+$/.test(page)) {
  console.error("Uso: npm run data:render:sample -- --page 2");
  process.exit(1);
}

await mkdir(outputDirectory, { recursive: true });

const outputPrefix = path.join(outputDirectory, "page");
const args = [
  "-png",
  "-r",
  "150",
  "-f",
  page,
  "-l",
  page,
  source,
  outputPrefix,
];
const child = spawn("pdftoppm", args, { stdio: "inherit" });

child.on("error", (error) => {
  console.error(`Impossibile avviare pdftoppm: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Pagina ${page} renderizzata in ${outputDirectory}`);
  } else {
    process.exitCode = code ?? 1;
  }
});
