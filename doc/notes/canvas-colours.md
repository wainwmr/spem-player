# Canvas Colour System

> **Scope:** `MusicCanvas.ts` — how colour is used for choir strips, selection, active-singing pulses, false-relation hotspots and false-relation pulses.  
> **Last updated:** 2026-06

---

## 1. Choir hues

The eight choirs are distinguished by **hue only**.  Hues are read from CSS custom properties (`--color-c1` … `--color-c8`) at runtime; the JavaScript supplies saturation and lightness dynamically.

- Hue - 360 - 320 - 30 - 50 - 110 - 150 - 190 - 220

*Source:* `src/scss/style.scss` (defaults) and `src/ts/common.ts` → `colors().choir[]`.

---

## 2. Voice-part strips

Each choir × part is drawn as a horizontal line for every `{from, to}` singing range (`this.ranges[c][p]`).  The stroke colour is:

```text
hsla(hue, saturation%, lightness%, 1)
```

### Lightness

Lightness depends on **theme**, **selection state**, and the **part index** `p` (0 = Soprano … 4 = Bass).

- Unselected, dull - `80 − 3p` - `38 − 3p`
- Selected (or intro / end-credits) - `45 − 3p` - `45 − 3p`

The `− 3p` term creates a subtle top-to-bottom gradient within each choir: higher parts are slightly lighter.

### Saturation

- **50 %** for unselected parts.
- **80 %** for the selected part or choir.

*Source:* `#drawVoiceParts()` in `src/ts/MusicCanvas.ts`.

---

## 3. Active-singing pulse

When a note begins, the part’s lightness is multiplied by a transient pulse value (`this.pulses[c][p]`).  The pulse is animated with an `easeOutCubic` curve over the note’s duration:

- **Light mode:** starts at `0.4`, rises to `1.0`.
- **Dark mode:** starts at `1.6`, decays to `1.0`.

Because lightness is multiplied by the pulse, light mode shows a brief dim-to-bright flash; dark mode shows a brief bright overshoot that settles back to normal.

*Source:* `#updatePulses()` and `#drawVoiceParts()` in `src/ts/MusicCanvas.ts`.

---

## 4. Selection highlight

A horizontal band is drawn behind the selected part (or across all five parts when `voicePart == "all"`).  It uses a single CSS-derived colour independent of choir hue:

```text
colors().highlight
```

*Source:* `#drawSelectionHighlight()` in `src/ts/MusicCanvas.ts`.

---

## 5. False-relation hotspots (static shimmer)

Every entry in `frLocations` renders a small radial-gradient circle at the midpoint of its `{from, to}` interval.

- Hue - Choir’s own hue
- Saturation - 100 %
- Lightness - Adaptive (see below)
- Alpha - `0.8 + 0.2·sin(6t + phase)` — perpetual breathing
- Radius - `partHeight × 0.6`

### Hotspot lightness formula

```text
base = isSelected ? 45 − 3p : dullBase − 3p
lightness = (base + 50) % 100
```

The `+ 50 % 100` rotation pushes hotspots into a complementary lightness range so they remain visible against the underlying voice strip.  Same-part selection rules apply as for voice strips.

### Hotspot gradient stops

1. **Centre** — full opacity at the computed lightness.
2. **Mid-stop** (25 % of radius) — 40 % of centre opacity.
3. **Edge** — transparent.

*Source:* `#drawFalseRelationHotspot()` in `src/ts/MusicCanvas.ts`.

---

## 6. False-relation pulses (playback flash)

When playback reaches `loc.from`, a pulse triggers and fades over **0.4 bars** (`FR_PULSE_FADE_BARS`).

- Hue - Choir’s own hue
- Saturation - 100 %
- Lightness - Fixed at **45 %** (`SELECTED_BASE_LIGHTNESS`)
- Radius - `partHeight × 2.5 × pulseStrength`
- Peak alpha - `pulseStrength × 1`, clamped to 1.0

### Decay curve

```text
pulseStrength = √(1 − t)   where t = elapsed / 0.4
```

### Pulse gradient stops

1. **Centre** — full alpha at lightness 45 %.
2. **Mid-stop** (50 % of radius) — 70 % of centre opacity.
3. **Edge** — transparent.

The mid-stop at 0.5 and 70 % opacity creates a flatter, more visible disc than the hotspot’s tighter gradient.

*Source:* `#drawFalseRelationPulses()` in `src/ts/MusicCanvas.ts`.

---

## Constants reference

- `DULL_BASE_LIGHTNESS_LIGHT` - 80 - Unselected parts (light theme)
- `DULL_BASE_LIGHTNESS_DARK` - 38 - Unselected parts (dark theme)
- `SELECTED_BASE_LIGHTNESS` - 45 - Selected parts + FR pulses
- `FR_PULSE_FADE_BARS` - 0.4 - Pulse decay duration
- `FR_PULSE_RADIUS_MULTIPLIER` - 2.5 - Pulse size relative to part height
- `FR_PULSE_SATURATION` - 100 - Pulse colour saturation
- `FR_PULSE_MAX_ALPHA` - 1.0 - Pulse alpha ceiling
- `FR_PULSE_ALPHA_FACTOR` - 1 - Pulse alpha multiplier
- `FR_PULSE_GRADIENT_MID_STOP` - 0.5 - Pulse gradient mid-point
- `FR_PULSE_GRADIENT_MID_ALPHA_FACTOR` - 0.7 - Pulse mid-stop opacity ratio
- `FR_HOTSPOT_SHIMMER_SPEED` - 6 rad/s - Hotspot breathing frequency
- `FR_HOTSPOT_BASE_ALPHA` - 0.8 - Hotspot mean opacity
- `FR_HOTSPOT_ALPHA_RANGE` - 0.2 - Hotspot opacity amplitude
- `FR_HOTSPOT_RADIUS_MULTIPLIER` - 0.6 - Hotspot size relative to part height
- `FR_HOTSPOT_SATURATION` - 100 - Hotspot colour saturation
- `FR_HOTSPOT_GRADIENT_MID_STOP` - 0.25 - Hotspot gradient mid-point
- `FR_HOTSPOT_GRADIENT_MID_ALPHA_FACTOR` - 0.4 - Hotspot mid-stop opacity ratio
