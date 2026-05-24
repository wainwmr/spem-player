#!/usr/bin/env python3
# Copyright (c) 2024-2026 Mark Wainwright
# SPDX-License-Identifier: MIT
r"""Post-process LilyPond-generated SVGs.

Parses \\pointAndClickOn anchor tags to determine which voice part each
graphical element belongs to, adds data-part="N" attributes, removes
anchor wrappers, strips height/width from the SVG root element, and
deduplicates repeated path shapes via <defs> and <use>.
"""

import argparse
import os
import re
import xml.dom.minidom as minidom
from collections import defaultdict
from urllib.parse import unquote

DEFAULT_SPEM_PATH = "src/lilypond/Hugh Keyte/spem.ly"
PART_INDICES = {
    "Soprano": 0,
    "Alto": 1,
    "Tenor": 2,
    "Baritone": 3,
    "Bass": 4,
}


def parse_variables(path: str, pattern: re.Pattern) -> list[tuple[int, int, int]]:
    """Parse a LilyPond file and return a list of (start_line, end_line, part_index)."""
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    variables: list[tuple[int, str, str]] = []
    for i, line in enumerate(lines, start=1):
        match = pattern.match(line)
        if match:
            variables.append((i, match.group(1), match.group(2)))

    part_map: list[tuple[int, int, int]] = []
    for idx, (start, _var_name, part_name) in enumerate(variables):
        end = variables[idx + 1][0] if idx + 1 < len(variables) else len(lines) + 1
        part_map.append((start, end, PART_INDICES[part_name]))

    return part_map


def find_part_index(line_number: int, part_map: list[tuple[int, int, int]]) -> int | None:
    for start, end, part_index in part_map:
        if start <= line_number < end:
            return part_index
    return None


def _non_transform_attrs(path: minidom.Element) -> dict[str, str]:
    return {
        path.attributes.item(i).name: path.attributes.item(i).value
        for i in range(path.attributes.length)
        if path.attributes.item(i).name not in ("d", "transform")
    }


def deduplicate_paths(doc: minidom.Document) -> None:
    """Replace repeated <path> shapes with <defs>/<use> references.

    Paths whose non-transform attributes differ across occurrences are left
    unchanged (defensive skip for attribute collision).
    """
    all_paths = list(doc.getElementsByTagName("path"))

    groups: dict[str, list[minidom.Element]] = defaultdict(list)
    for path in all_paths:
        d = path.getAttribute("d")
        if d:
            groups[d].append(path)

    valid: dict[str, list[minidom.Element]] = {}
    for d, paths in groups.items():
        if len(paths) < 2:
            continue
        first_attrs = _non_transform_attrs(paths[0])
        if any(_non_transform_attrs(p) != first_attrs for p in paths[1:]):
            continue
        valid[d] = paths

    if not valid:
        return

    svg_elem = doc.documentElement
    defs = doc.createElement("defs")
    svg_elem.insertBefore(defs, svg_elem.firstChild)

    for i, (d, paths) in enumerate(valid.items()):
        def_id = f"spem-path-{i}"

        def_path = doc.createElement("path")
        def_path.setAttribute("id", def_id)
        def_path.setAttribute("d", d)
        for name, value in _non_transform_attrs(paths[0]).items():
            def_path.setAttribute(name, value)
        defs.appendChild(def_path)

        for path in paths:
            use = doc.createElement("use")
            use.setAttribute("href", f"#{def_id}")
            transform = path.getAttribute("transform")
            if transform:
                use.setAttribute("transform", transform)
            path.parentNode.replaceChild(use, path)


def postprocess_svg(svg_path: str, spem_ly_path: str, words_ly_path: str) -> None:
    note_pattern = re.compile(
        r"^(notes(?:I{1,3}|IV)[AB](Soprano|Alto|Tenor|Baritone|Bass))\s*=\s*\\relative"
    )
    words_pattern = re.compile(
        r"^(words(?:I{1,3}|IV)[AB](Soprano|Alto|Tenor|Baritone|Bass))\s*=\s*\\lyricmode"
    )

    note_map = parse_variables(spem_ly_path, note_pattern)
    words_map = parse_variables(words_ly_path, words_pattern)

    doc = minidom.parse(svg_path)

    a_elems = list(doc.getElementsByTagName("a"))
    href_attr = "href"
    xlink_ns = "http://www.w3.org/1999/xlink"

    for a_elem in a_elems:
        href = a_elem.getAttributeNS(xlink_ns, href_attr)
        if not href:
            continue

        href = unquote(href)
        part_index = None

        # Check words first since "spem words.ly" contains "spem.ly"
        if "spem words.ly" in href or "spem%20words.ly" in href:
            match = re.search(r":(\d+):\d+:\d+$", href)
            if match:
                part_index = find_part_index(int(match.group(1)), words_map)
        elif "spem.ly:" in href:
            match = re.search(r":(\d+):\d+:\d+$", href)
            if match:
                part_index = find_part_index(int(match.group(1)), note_map)

        if part_index is not None:
            for child in a_elem.childNodes:
                if (
                    child.nodeType == child.ELEMENT_NODE
                    and "data-part" not in child.attributes.keys()
                ):
                    child.setAttribute("data-part", str(part_index))

        # Unwrap anchor: move children to parent, then remove anchor
        parent = a_elem.parentNode
        if parent is not None:
            for child in list(a_elem.childNodes):
                parent.insertBefore(child, a_elem)
            parent.removeChild(a_elem)

    # Strip height and width from the root <svg> element
    svg_elem = doc.documentElement
    if svg_elem.tagName == "svg":
        if svg_elem.hasAttribute("height"):
            svg_elem.removeAttribute("height")
        if svg_elem.hasAttribute("width"):
            svg_elem.removeAttribute("width")

    deduplicate_paths(doc)

    with open(svg_path, "w", encoding="utf-8") as f:
        doc.documentElement.writexml(f)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Post-process LilyPond SVG: add data-part attributes, unwrap anchors, strip dimensions."
    )
    parser.add_argument("svg", help="Path to the SVG file to post-process")
    parser.add_argument(
        "--spem",
        default=DEFAULT_SPEM_PATH,
        help=f"Path to spem.ly (default: {DEFAULT_SPEM_PATH})",
    )
    parser.add_argument(
        "--words",
        default=None,
        help="Path to spem words.ly (default: same directory as spem.ly)",
    )
    args = parser.parse_args()

    words_ly_path = args.words
    if words_ly_path is None:
        words_ly_path = os.path.join(os.path.dirname(args.spem), "spem words.ly")

    postprocess_svg(args.svg, args.spem, words_ly_path)


if __name__ == "__main__":
    main()
