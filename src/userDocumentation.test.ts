import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const documentationPath = resolve(process.cwd(), "public/documentazione.html");

describe("user documentation artifact", () => {
  it("contains the operator sections and the direct cards download", () => {
    const documentation = readFileSync(documentationPath, "utf8");

    expect(documentation).toContain("<h1>Tombola RSA</h1>");
    expect(documentation).toContain("<h2>Come funziona</h2>");
    expect(documentation).toContain("<h2>Uso durante una partita</h2>");
    expect(documentation).toContain("<h2>Comandi e accessibilità</h2>");
    expect(documentation).toContain(
      "https://github.com/giulios123/TombolaRSA/raw/main/data/source/Cartelle-Tabellone.pdf",
    );
    expect(documentation).not.toContain("Dettagli tecnici");
    expect(documentation).not.toContain("validatore indipendente");
    expect(documentation).not.toContain("backend");
    expect(documentation).not.toContain("solver");
  });
});
