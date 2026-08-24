import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = resolve(projectRoot, "README.md");
const outputPath = resolve(projectRoot, "public/documentazione.html");
const cardsDownloadUrl =
  "https://github.com/giulios123/TombolaRSA/raw/main/data/source/Cartelle-Tabellone.pdf";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value) {
  let rendered = escapeHtml(value);
  rendered = rendered.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(
    /`([^`]+)`/g,
    '<span class="inline-note">$1</span>',
  );
  return rendered;
}

function extractTop(markdown) {
  const lines = markdown.split(/\r?\n/);
  const firstSectionIndex = lines.findIndex((line) => /^##\s/.test(line));
  if (firstSectionIndex < 1) {
    throw new Error("README.md does not contain a usable top section");
  }
  return lines.slice(0, firstSectionIndex).join("\n").trim();
}

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line === `## ${heading}`);
  if (headingIndex < 0) {
    throw new Error(`README.md is missing the section: ${heading}`);
  }

  const nextSectionIndex = lines.findIndex(
    (line, index) => index > headingIndex && /^##\s/.test(line),
  );
  return lines
    .slice(
      headingIndex + 1,
      nextSectionIndex < 0 ? lines.length : nextSectionIndex,
    )
    .join("\n")
    .trim();
}

function renderMarkdown(markdown) {
  const lines = normalizeLines(markdown);
  const output = [];
  let paragraph = [];
  let listType = null;

  const closeList = () => {
    if (listType) {
      output.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  for (const line of lines) {
    if (line.trim() === "") {
      closeParagraph();
      closeList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      closeParagraph();
      closeList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const unorderedItem = /^-\s+(.+)$/.exec(line);
    if (unorderedItem) {
      closeParagraph();
      if (listType !== "ul") {
        closeList();
        output.push("<ul>");
        listType = "ul";
      }
      output.push(`<li>${renderInline(unorderedItem[1])}</li>`);
      continue;
    }

    const orderedItem = /^\d+\.\s+(.+)$/.exec(line);
    if (orderedItem) {
      closeParagraph();
      if (listType !== "ol") {
        closeList();
        output.push("<ol>");
        listType = "ol";
      }
      output.push(`<li>${renderInline(orderedItem[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  closeParagraph();
  closeList();
  return output.join("\n");
}

function normalizeLines(markdown) {
  const normalized = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") {
      normalized.push("");
      continue;
    }

    const startsBlock = /^(#{1,3}\s|[-*]\s+|\d+\.\s+)/.test(line);
    const previousLine = normalized.at(-1);
    const previousIsHeading = previousLine
      ? /^#{1,3}\s/.test(previousLine)
      : false;
    if (
      !startsBlock &&
      previousLine &&
      previousLine !== "" &&
      !previousIsHeading
    ) {
      normalized[normalized.length - 1] = `${previousLine} ${line}`;
    } else {
      normalized.push(line);
    }
  }

  return normalized;
}

function buildDocument(markdown) {
  const sections = [
    renderMarkdown(extractTop(markdown)),
    `<h2>Come funziona</h2>\n${renderMarkdown(extractSection(markdown, "Come funziona"))}`,
    `<h2>Uso durante una partita</h2>\n${renderMarkdown(extractSection(markdown, "Uso durante una partita"))}`,
    `<h2>Comandi e accessibilità</h2>\n${renderMarkdown(extractSection(markdown, "Comandi e accessibilità"))}`,
  ];

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Documentazione | Tombola RSA</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #102a43;
        background: #f3f7fa;
      }

      * { box-sizing: border-box; }

      body { margin: 0; }

      main {
        width: min(100% - 2rem, 48rem);
        margin: 0 auto;
        padding: 2rem 0 3rem;
      }

      article {
        padding: clamp(1.25rem, 5vw, 3rem);
        background: #fff;
        border: 1px solid #d9e2ec;
        border-radius: 1.25rem;
        box-shadow: 0 1rem 3rem rgb(16 42 67 / 12%);
      }

      h1, h2 { line-height: 1.1; }
      h1 { margin: 0 0 1.5rem; font-size: clamp(2rem, 7vw, 3.25rem); }
      h2 { margin: 2.25rem 0 0.85rem; font-size: clamp(1.35rem, 4vw, 1.8rem); }
      p, li { color: #486581; font-size: 1.05rem; line-height: 1.65; }
      ul, ol { padding-left: 1.5rem; }
      li + li { margin-top: 0.5rem; }
      strong { color: #102a43; }
      a { color: #145d80; font-weight: 750; }
      a:focus-visible { outline: 4px solid #d9901e; outline-offset: 3px; }
      .inline-note { color: #627d98; }
      .downloads { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #d9e2ec; }
      .download-link { display: inline-block; padding: 0.8rem 1rem; border-radius: 0.6rem; background: #d9eef7; }

      @media (max-width: 520px) {
        main { padding-top: 1rem; }
        p, li { font-size: 1rem; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; }
      }
    </style>
  </head>
  <body>
    <main>
      <article>
        ${sections.join("\n")}
        <section class="downloads" aria-labelledby="downloads-title">
          <h2 id="downloads-title">Scarica le cartelle</h2>
          <p>Qui puoi scaricare il PDF con le cartelle e il tabellone.</p>
          <a class="download-link" href="${cardsDownloadUrl}" target="_blank" rel="noreferrer">Scarica le cartelle (PDF)</a>
        </section>
      </article>
    </main>
  </body>
</html>
`;
}

const readme = await readFile(readmePath, "utf8");
const documentHtml = buildDocument(readme);

let previousDocument = null;
try {
  previousDocument = await readFile(outputPath, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (previousDocument === documentHtml) {
  console.log("User documentation is already up to date.");
} else {
  await writeFile(outputPath, documentHtml, "utf8");
  console.log(`Generated ${outputPath}`);
}
