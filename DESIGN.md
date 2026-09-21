# Bridge — design system

A departure hall, not a control room.

## World
A Solari split-flap board. Rows are physical drums that step through an
alphabet to reach a new value, so a status change is travel rather than a swap.
The surface is warm near-black because such a board is lit from the front and
its lacquer holds the light; a cool grey would read as a screen.

Anti-reference: god.buildwithoracle.com. Isometric rooms, per-session accent
palettes, many tabs. Bridge keeps its API and discards its look entirely.

## Palette
| Token | Value | Role |
|---|---|---|
| `--hall` | `#0b0908` | Page ground, warm near-black |
| `--rail` | `#14100c` | Row and panel surface |
| `--seam` | `#070505` | Gaps between rows |
| `--amber` | `#ffb224` | The one saturated hue: wordmark, cursor, working |
| `--ink` | `#f5ead8` | Primary text, 14.6:1 |
| `--ink-soft` | `#b3a48c` | Secondary, 7.1:1 |
| `--ink-faint` | `#8e8270` | Tertiary, 5.3:1 |
| `--blocked` | `#ff6a3d` | Blocked only, so it is never ambient |
| `--idle` | `#8a9a8f` | Idle |
| `--done` | `#7fb069` | Done, and an authenticated link |

Amber is the only saturated hue in ordinary use, which is what lets blocked own
red outright.

## Type
- **Archivo Variable** at `wdth 92` for prose and labels.
- **JetBrains Mono Variable** for every value: sessions, folders, engines,
  statuses, counts, pane output. Monospace here is measurement, not costume —
  the drums must be fixed-width to flip in place.
- Tabular numerals on all counts.

## Motion
One authored moment: the flap. Each drum steps at 42ms through
` A-Z 0-9 -·:/`, so columns settle left to right because earlier drums have
less distance to cover. A settling drum picks up a leading-edge highlight.
`prefers-reduced-motion` sets the value directly with no travel.

Nothing else animates except the connection lamp while connecting.

## Layout
- Single column, max 1180px, 44px rows.
- Columns: Folder, Engine, Window, Status. Folder leads; status is right-aligned.
- Under 860px the row folds to two areas, folder over engine, status kept.
- Sort is blocked, working, idle, done, then folder name. The board orders
  itself by what needs attention.

## Browser surfaces
Selection, caret, focus ring, and scrollbar are all themed from the palette.

## Contrast
Every text role measured against its own computed background: lowest is 4.6:1,
all clear 4.5:1.
