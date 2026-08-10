# Migrating from v4 to v5

v5 is a rewrite of the layout engine and packaging. Most v4 code keeps
working — `drawText(ctx, text, config)` has the same shape — but text can
render slightly differently, and a few helpers changed. This guide covers
everything, roughly in the order you'll hit it.

## TL;DR

```js
// v4 and v5 — still works
import { drawText } from 'canvas-txt'

const { height } = drawText(ctx, 'Hello world', {
  x: 100,
  y: 200,
  width: 200,
  height: 200,
  fontSize: 24,
})
```

If that's all you use, you're done. Read on for the differences you may
notice, and for the new APIs worth switching to.

## Requirements

| | v4 | v5 |
| --- | --- | --- |
| Node | any | **>= 18** |
| Browsers | ES2015+ | Modern evergreen (needs `Intl.Segmenter`, ES2022) |
| Module format | UMD + ESM | **ESM-first**, CJS via `require`, IIFE for `<script>` |

The CDN global is unchanged: `<script src="//unpkg.com/canvas-txt"></script>`
still exposes `window.canvasTxt`.

## Rendering differences (no code changes, but pixels can move)

1. **Line height is now the font's real line box.** v4 measured the ascent
   of a capital `M`, which undershoots for most custom fonts
   ([#93](https://github.com/geongeorge/Canvas-Txt/issues/93)). v5 uses
   `fontBoundingBoxAscent/Descent` where available. Lines sit slightly
   further apart and descenders are accounted for. If you need the old
   density, pass an explicit `lineHeight`.
2. **Wrapping is Unicode-correct.** Line-break opportunities come from
   `Intl.Segmenter`: CJK and Thai break at real word boundaries, emoji and
   combining marks are never split mid-codepoint. Break points can differ
   from v4 in edge cases — v4 could split anywhere, including inside a
   surrogate pair.
3. **Justification no longer mutates your text.** v4 injected U+200A hair
   spaces into the returned strings. v5 computes per-word positions and
   paints words individually; `line.text` stays exactly what you passed in.
4. **Vertical centering uses half-leading** (like CSS): extra `lineHeight`
   beyond the font's natural height is split evenly above and below each
   line. v4 centered using a `fontSize`-based approximation.

## API changes

### `drawText`

- **Return value** is now `{ height, width, lines }` instead of `{ height }`.
  Existing destructuring keeps working.
- **New config options**: `overflow` (`'visible' | 'hidden' | 'ellipsis'`),
  `maxLines`, `letterSpacing` (`'2px'`), `direction` (`'rtl'`), and
  `style: { fill, stroke, strokeWidth }` for per-call colors (previously you
  set `ctx.fillStyle` yourself — that still works and remains the default).
- The `CanvasTextConfig` type is renamed `DrawTextConfig`; the old name is
  exported as an alias.

### `splitText`

Still exported with the same call shape, but the `justify` flag is
**ignored** — justification happens at paint time now, so there are no hair
spaces to bake into strings. If you used `splitText` to predict what
`drawText` renders, that contract still holds.

### `getTextHeight`

Unchanged signature. Returns the improved (font line box) measurement, so
expect slightly larger values — same change as rendering difference #1.

### Contexts are no longer `CanvasRenderingContext2D`

Every function is typed against a minimal structural `TextContext`
interface. If you cast node-canvas contexts before —

```ts
// v4
drawText(ctx as unknown as CanvasRenderingContext2D, ...)

// v5
drawText(ctx, ...) // node-canvas, skia-canvas, OffscreenCanvas all satisfy TextContext
```

— delete the cast.

## New in 5.0: shared measurement cache

Segment widths are cached in a module-level per-font cache by default, and
identical layouts are memoized, so repeated layout is arithmetic and
lookups instead of `measureText` calls — 27× to 1,400× faster than v4
depending on workload. Three consequences:

- **Memoized layouts are frozen.** `layoutText` can return the same object
  to two callers, so mutating it throws in strict mode. Build your own
  objects if you need to post-process a layout (or pass `cache: false`,
  whose results are yours and stay mutable).

- **After loading web fonts, call `clearMeasurementCache()`** (e.g. in
  `document.fonts.ready.then(...)`). Otherwise widths measured against the
  fallback font stick around. v4 had no cross-call state, so this concern
  is new.
- If you'd rather have v4-style exact, stateless measuring, pass
  `cache: false` in any config — lines are then measured whole, per call.

## New APIs worth adopting

The core of v5 is a layout/paint split:

```js
import { layoutText, drawTextLayout } from 'canvas-txt'

// Layout once (the expensive part: wrapping + measuring)...
const layout = layoutText(ctx, text, { width: 300, height: 200, fontSize: 18 })

// ...paint every frame (cheap), anywhere, as often as you like
drawTextLayout(ctx, layout, { x: 50, y: 40 })
drawTextLayout(ctx, layout, { x: 400, y: 40, style: { fill: '#888' } })
```

`layout.lines` gives you each line's text, position and width — use it for
hit-testing, decorations, or sizing. `measureText(ctx, text, config)`
returns `{ lines, width, height }` when you only need dimensions.

## Repo layout (contributors only)

The repository is now a pnpm workspace: the library lives in
`packages/canvas-txt`, the demo site in `apps/docs`. `pnpm test` and
`pnpm build` at the root still do what you expect.
