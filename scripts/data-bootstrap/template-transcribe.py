#!/usr/bin/env python3
"""Offline bootstrap transcription for the image-only Tombola PDF.

This script is deliberately not part of the production bundle. It learns digit
templates from the reviewed page-2 sample, recognizes the same cell geometry
on the remaining rendered pages, and emits reviewable OCR artifacts. It never
overwrites the production dataset.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class CellRecognition:
    value: int | None
    confidence: float
    margin: float
    segments: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages-dir", type=Path, required=True)
    parser.add_argument("--sample-json", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-md", type=Path, required=True)
    parser.add_argument("--report-json", type=Path, required=True)
    return parser.parse_args()


def load_rgb(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB"))


def blue_mask(image: np.ndarray) -> np.ndarray:
    red, green, blue = image[:, :, 0], image[:, :, 1], image[:, :, 2]
    return (red < 100) & (green > 80) & (blue > 120)


def groups_above(values: np.ndarray, minimum: int) -> list[tuple[int, int]]:
    indices = np.flatnonzero(values > minimum)
    groups: list[list[int]] = []
    for index in indices:
        index = int(index)
        if not groups or index > groups[-1][-1] + 1:
            groups.append([index])
        else:
            groups[-1].append(index)
    return [(group[0], group[-1]) for group in groups]


def detect_grid(image: np.ndarray) -> tuple[list[int], list[list[int]]]:
    mask = blue_mask(image)
    vertical_groups = groups_above(mask.sum(axis=0), int(image.shape[0] * 0.55))
    horizontal_groups = groups_above(mask.sum(axis=1), int(image.shape[1] * 0.8))

    vertical = [round((start + end) / 2) for start, end in vertical_groups]
    horizontal = [round((start + end) / 2) for start, end in horizontal_groups]
    if len(vertical) != 10 or len(horizontal) != 15:
        raise ValueError(
            "Geometria inattesa: "
            f"verticali={len(vertical)} (attese 10), "
            f"orizzontali={len(horizontal)} (attese 15)"
        )
    # Each card contributes a header-bottom line plus four grid lines. The
    # first line of each group is the header top and must not be used as a
    # number-row boundary.
    return vertical, [horizontal[offset + 1 : offset + 5] for offset in (0, 5, 10)]


def black_mask(cell: np.ndarray) -> np.ndarray:
    red, green, blue = cell[:, :, 0], cell[:, :, 1], cell[:, :, 2]
    return (red < 120) & (green < 120) & (blue < 120)


def crop_cell(image: np.ndarray, x0: int, x1: int, y0: int, y1: int) -> np.ndarray:
    margin_x = max(4, round((x1 - x0) * 0.06))
    margin_y = max(4, round((y1 - y0) * 0.06))
    return image[y0 + margin_y : y1 - margin_y, x0 + margin_x : x1 - margin_x]


def split_glyphs(mask: np.ndarray) -> list[np.ndarray]:
    column_has_ink = mask.any(axis=0)
    groups = groups_above(column_has_ink.astype(np.int64), 0)
    glyphs: list[np.ndarray] = []
    for start, end in groups:
        glyph = mask[:, start : end + 1]
        row_has_ink = glyph.any(axis=1)
        rows = groups_above(row_has_ink.astype(np.int64), 0)
        if not rows:
            continue
        top, bottom = rows[0][0], rows[-1][1]
        trimmed = glyph[top : bottom + 1]
        if trimmed.size and int(trimmed.sum()) >= 12:
            glyphs.append(trimmed)
    return glyphs


def normalize_glyph(glyph: np.ndarray, width: int = 32, height: int = 48) -> np.ndarray:
    source = Image.fromarray((~glyph * 255).astype(np.uint8), mode="L")
    scale = min((width - 4) / glyph.shape[1], (height - 4) / glyph.shape[0])
    resized_width = max(1, round(glyph.shape[1] * scale))
    resized_height = max(1, round(glyph.shape[0] * scale))
    resized = source.resize((resized_width, resized_height), Image.Resampling.NEAREST)
    canvas = Image.new("L", (width, height), 0)
    canvas.paste(resized, ((width - resized_width) // 2, (height - resized_height) // 2))
    return np.asarray(canvas, dtype=np.float32) / 255.0


def cell_glyphs(
    image: np.ndarray,
    x_lines: list[int],
    y_lines: list[int],
    row: int,
    column: int,
) -> list[np.ndarray]:
    cell = crop_cell(image, x_lines[column], x_lines[column + 1], y_lines[row], y_lines[row + 1])
    return [normalize_glyph(glyph) for glyph in split_glyphs(black_mask(cell))]


def template_cells(
    image: np.ndarray,
    x_lines: list[int],
    y_lines: list[int],
    grid: list[list[int | None]],
) -> dict[int, list[np.ndarray]]:
    templates: dict[int, list[np.ndarray]] = {digit: [] for digit in range(10)}
    for row, values in enumerate(grid):
        for column, value in enumerate(values):
            if value is None:
                continue
            glyphs = cell_glyphs(image, x_lines, y_lines, row, column)
            expected = [int(character) for character in str(value)]
            if len(glyphs) != len(expected):
                raise ValueError(
                    f"Impossibile segmentare il campione {value} alla riga {row + 1}, colonna {column + 1}: "
                    f"ottenuti {len(glyphs)} glifi"
                )
            for digit, glyph in zip(expected, glyphs):
                templates[digit].append(glyph)
    return templates


def glyph_distance(left: np.ndarray, right: np.ndarray) -> float:
    return float(np.mean(np.abs(left - right)))


def recognize_cell(
    image: np.ndarray,
    x_lines: list[int],
    y_lines: list[int],
    row: int,
    column: int,
    templates: dict[int, list[np.ndarray]],
) -> CellRecognition:
    glyphs = cell_glyphs(image, x_lines, y_lines, row, column)
    if not glyphs:
        return CellRecognition(None, 1.0, 1.0, 0)

    digits: list[int] = []
    confidence_values: list[float] = []
    margins: list[float] = []
    for glyph in glyphs:
        distances = sorted(
            (min(glyph_distance(glyph, template) for template in candidates), digit)
            for digit, candidates in templates.items()
            if candidates
        )
        best_distance, best_digit = distances[0]
        second_distance = distances[1][0] if len(distances) > 1 else 1.0
        digits.append(best_digit)
        confidence_values.append(max(0.0, 1.0 - best_distance))
        margins.append(max(0.0, second_distance - best_distance))

    value = int("".join(str(digit) for digit in digits))
    return CellRecognition(
        value=value,
        confidence=min(confidence_values),
        margin=min(margins),
        segments=len(glyphs),
    )


def read_sample(path: Path) -> list[dict[str, object]]:
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def page_paths(directory: Path) -> list[Path]:
    return sorted(directory.glob("page-*.png"))


def build_transcription(
    page_files: Iterable[Path],
    sample_cards: list[dict[str, object]],
) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    page_files = list(page_files)
    if len(page_files) != 30:
        raise ValueError(f"Attese 30 pagine di cartelle, trovate {len(page_files)}")

    sample_image = load_rgb(page_files[0])
    sample_x, sample_ys = detect_grid(sample_image)
    templates: dict[int, list[np.ndarray]] = {digit: [] for digit in range(10)}
    for index, card in enumerate(sample_cards):
        grid = card["grid"]
        assert isinstance(grid, list)
        templates_for_card = template_cells(sample_image, sample_x, sample_ys[index], grid)
        for digit, values in templates_for_card.items():
            templates[digit].extend(values)

    cards: list[dict[str, object]] = []
    report: list[dict[str, object]] = []
    for page_index, page_path in enumerate(page_files):
        image = load_rgb(page_path)
        x_lines, y_lines_per_card = detect_grid(image)
        for slot, y_lines in enumerate(y_lines_per_card):
            card_id = page_index * 3 + slot + 1
            grid: list[list[int | None]] = []
            cell_reports: list[dict[str, object]] = []
            for row in range(3):
                values: list[int | None] = []
                for column in range(9):
                    result = recognize_cell(image, x_lines, y_lines, row, column, templates)
                    values.append(result.value)
                    cell_reports.append(
                        {
                            "row": row + 1,
                            "column": column + 1,
                            "value": result.value,
                            "confidence": round(result.confidence, 4),
                            "margin": round(result.margin, 4),
                            "segments": result.segments,
                        }
                    )
                grid.append(values)
            cards.append({"id": card_id, "grid": grid})
            report.append(
                {
                    "id": card_id,
                    "sourcePage": page_index + 2,
                    "sourceSlot": ["top", "middle", "bottom"][slot],
                    "cells": cell_reports,
                }
            )
    return cards, report


def markdown_for(cards: list[dict[str, object]], report: list[dict[str, object]]) -> str:
    report_by_id = {int(item["id"]): item for item in report}
    lines = [
        "# Trascrizione assistita - cartelle 1-90",
        "",
        "Stato: `OCR OFFLINE - REVISIONE VISIVA OBBLIGATORIA`",
        "",
        "Fonte: `data/source/Cartelle-Tabellone.pdf`. Questo file è una bozza generata da template grafici ricavati dal campione verificato della pagina 2; non è ancora approvato per la produzione.",
        "",
        "Legenda: `·` = cella vuota.",
        "",
    ]
    for card in cards:
        card_id = int(card["id"])
        grid = card["grid"]
        source = report_by_id[card_id]
        lines.extend(
            [
                f"## Cartella {card_id}",
                "",
                f"Fonte: pagina PDF {source['sourcePage']}, posizione {source['sourceSlot']}.",
                "",
                "```text",
            ]
        )
        assert isinstance(grid, list)
        for row in grid:
            assert isinstance(row, list)
            lines.append(" ".join("·" if value is None else str(value) for value in row))
        lines.extend(["```", "", "Revisione: `da verificare visivamente`", ""])
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    page_files = page_paths(args.pages_dir)
    sample_cards = read_sample(args.sample_json)
    cards, report = build_transcription(page_files, sample_cards)

    for output in (args.output_json, args.output_md, args.report_json):
        output.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_md.write_text(markdown_for(cards, report), encoding="utf-8")
    args.report_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generate {len(cards)} cartelle OCR in {args.output_json}")
    print(f"Report celle in {args.report_json}")


if __name__ == "__main__":
    main()
