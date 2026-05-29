/**
 * Generate a minimal fixture SVG for MusicScore tests.
 *
 * The output has enough structure to satisfy getBars(), #updatePartHighlight(),
 * and #createClefOverlay() without requiring real LilyPond-generated files.
 */

// Widths must be large enough that bar 1's x-coordinate clears
// MusicScore.getBars()'s `x > 6` filter (which discards tenor-clef false
// positives near the left edge in real SVGs). Bar 1 lands at
// `width / (barCount + 1)`, i.e. `width / 138`. width=800 gives x ≈ 5.8
// — below the filter, so bar 1 silently drops and `bars.length` is 138
// instead of 139. width=960 gives x ≈ 6.96, which clears it.
const VIEWBOX_WIDTHS: Record<string, number> = {
  modern: 1000,
  early: 960,
};

const VIEWBOX_HEIGHT = 500;

/**
 * @param scoreType - "modern" or "early"
 * @returns SVG string
 */
export function makeFixtureSvg(scoreType: string): string {
  const width = VIEWBOX_WIDTHS[scoreType] ?? VIEWBOX_WIDTHS.modern;
  const barCount = 137; // Real scores have bars 1-137 numbered
  const lines: string[] = [];

  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${VIEWBOX_HEIGHT}">`
  );

  // Bar numbers: 137 tspans inside g>text elements, spaced across the width.
  // Bar 0 (intro) and bar 138 (end) are added by getBars() itself.
  for (let i = 1; i <= barCount; i++) {
    const x = (i * width) / (barCount + 1);
    lines.push(
      `  <g transform="translate(${x.toFixed(4)}, 2.8265)">`,
      `    <text font-family="serif" font-size="1.7461" text-anchor="start" fill="currentColor">`,
      `      <tspan>${i}</tspan>`,
      `    </text>`,
      `  </g>`
    );
  }

  // Five staff clusters (one per voice part).
  // All lines of a single staff share the same parent <g> transform so that
  // #updatePartHighlight() clusters them correctly (lines within 2 units of
  // each other are grouped).
  const staffY = [20, 80, 140, 200, 260];
  for (let part = 0; part < 5; part++) {
    const y = staffY[part];
    lines.push(`  <g transform="translate(0, ${y.toFixed(4)})">`);
    // A staff has 5 lines spaced 4 units apart
    for (let l = 0; l < 5; l++) {
      const ly = l * 4;
      lines.push(
        `    <line x1="0" y1="${ly}" x2="${width}" y2="${ly}" stroke="black" stroke-width="0.5"/>`
      );
    }
    lines.push(`  </g>`);

    // Add a data-part group for dimming tests
    lines.push(
      `  <g data-part="${part}">`,
      `    <rect x="0" y="${y}" width="${width}" height="20" fill="none"/>`,
      `  </g>`
    );
  }

  lines.push(`</svg>`);
  return lines.join("\n");
}
