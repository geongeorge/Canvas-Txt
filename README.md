<div align="center">
<img src="./apps/docs/src/assets/featured.png" width=600 alt="canvas-txt multiline text on html canvas">
<h3>Canvas Txt 📐</h3>
<p>
Transforming Your Canvas with Multiline Magic ✨
</p>

<p align="center">

<img alt="NPM" src="https://img.shields.io/bundlephobia/minzip/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/v/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/l/canvas-txt?style=flat-square">

</p>

#### A miniscule library to render text on HTML5 Canvas with ZERO dependencies

</div>

> **Upgrading from v4?** See the [migration guide](./MIGRATION.md) — most
> code keeps working, but rendering is more accurate and there are new APIs
> worth adopting.

## Features

- [x] Multiline text with automatic, Unicode-correct line breaks (CJK, emoji, combining marks — via `Intl.Segmenter`)
- [x] Horizontal & vertical alignment, true justification (no injected characters)
- [x] `overflow: hidden / ellipsis` and `maxLines` clamping
- [x] Layout/paint split: lay out once, repaint every frame with zero re-measuring
- [x] Fill and stroke styles, `letterSpacing`, RTL direction
- [x] Works in browsers, workers (`OffscreenCanvas`), node-canvas and skia-canvas — no type casts
- [x] Debug mode that draws the box and alignment guides

## Demo

See Demo: [Here](https://canvas-txt.geongeorge.com)

## Install

```
npm i canvas-txt
```

# Usage

```html
<canvas id="myCanvas" width="500" height="500"></canvas>
```

## Quick start

```javascript
import { drawText } from 'canvas-txt'

const c = document.getElementById('myCanvas')
const ctx = c.getContext('2d')

ctx.clearRect(0, 0, 500, 500)

const txt = 'Lorem ipsum dolor sit amet'

const { height, width, lines } = drawText(ctx, txt, {
  x: 100,
  y: 200,
  width: 200,
  height: 200,
  fontSize: 24,
})

console.log(`Total height = ${height}`)
```

## Layout once, paint forever

`drawText` is a convenience wrapper. For anything that redraws — animation
loops, canvas editors — lay out once and paint the cached layout:

```javascript
import { layoutText, drawTextLayout } from 'canvas-txt'

const layout = layoutText(ctx, txt, { width: 300, height: 200, fontSize: 18 })

// every frame, as often as you like — no re-measuring:
drawTextLayout(ctx, layout, { x: 50, y: 40 })

// layout.lines: [{ text, x, y, width, words }] — hit-test it, decorate it
// layout.height, layout.width, layout.clipped
```

## Node canvas

Works with [node-canvas](https://github.com/Automattic/node-canvas) and
[skia-canvas](https://github.com/samizdatco/skia-canvas) directly — the
functions are typed against a minimal `TextContext` interface, so no casts:

```js
import { createCanvas } from 'canvas'
import { drawText } from 'canvas-txt'
import * as fs from 'node:fs'

const canvas = createCanvas(400, 400)
const ctx = canvas.getContext('2d')

const { height } = drawText(ctx, 'Hello World!', {
  x: 100,
  y: 200,
  width: 200,
  height: 200,
  fontSize: 24,
})

fs.writeFileSync('output.png', canvas.toBuffer('image/png'))
console.log(`Total height = ${height}`)
```

## CDN

```html
<script src="//unpkg.com/canvas-txt"></script>
```

```javascript
const { drawText } = window.canvasTxt
/// ...remaining same
```

## Performance

Wrapping is fast by default: segment widths are kept in a module-level
cache per font, so after warmup, line layout is arithmetic over cached
numbers instead of `measureText` calls.

Two things to know:

1. **Loading web fonts invalidates measurements.** Widths cached while a
   fallback font was active would be wrong for the real font — flush the
   cache when fonts arrive:

   ```js
   import { clearMeasurementCache } from 'canvas-txt'

   document.fonts.ready.then(() => clearMeasurementCache())
   ```

2. **You can turn it off.** Pass `cache: false` to any call to measure
   exactly, per call, with no shared state — assembled lines are then
   measured whole (including cross-word kerning) instead of summed from
   cached segment widths:

   ```js
   drawText(ctx, txt, { x, y, width, height, cache: false })
   ```

Identical layouts are additionally memoized (bounded, ~500 entries), and
memoized layouts come back **frozen** — treat them as immutable.

Measured against [canvas-hypertxt](https://github.com/glideapps/canvas-hypertxt)'s
standard mode (the benchmark lives in
[`packages/canvas-txt/bench`](./packages/canvas-txt/bench); 5000 iterations,
600-char strings, node-canvas, Apple Silicon):

| Workload                       | canvas-txt v5 | canvas-hypertxt | canvas-txt v4 |
| ------------------------------ | ------------: | --------------: | ------------: |
| Same text repeated             |     1.1 µs/op |       0.9 µs/op |  1,566 µs/op  |
| 500 strings cycled             |     5.6 µs/op |      48.3 µs/op |  1,423 µs/op  |
| Never-repeating strings        |    51.3 µs/op |     566.2 µs/op |  1,382 µs/op  |

Only hypertxt's estimation mode ("hyper wrapping", which guesses widths
instead of measuring) is faster on long never-before-seen strings — with
exact measuring, canvas-txt v5 is the faster library while staying
Unicode-correct.

## Properties

|    Properties    |   Default    | Description                                                                                                         |
| :--------------: | :----------: | :------------------------------------------------------------------------------------------------------------------ |
|     `width`      | **Required** | Width of the text box                                                                                               |
|     `height`     | **Required** | Height of the text box                                                                                              |
|       `x`        | **Required** | X position of the text box                                                                                          |
|       `y`        | **Required** | Y position of the text box                                                                                          |
|     `debug`      |   `false`    | Shows the border and align gravity for debugging purposes                                                           |
|     `align`      |   `center`   | Text align. Other possible values: `left`, `right`                                                                  |
|     `vAlign`     |   `middle`   | Text vertical align. Other possible values: `top`, `bottom`                                                         |
|      `font`      |   `Arial`    | Font family of the text                                                                                             |
|    `fontSize`    |     `14`     | Font size of the text in px                                                                                         |
|   `fontStyle`    |     `''`     | Font style, same as css font-style. Examples: `italic`, `oblique 40deg`                                             |
|  `fontVariant`   |     `''`     | Font variant, same as css font-variant. Examples: `small-caps`, `slashed-zero`                                      |
|   `fontWeight`   |     `''`     | Font weight, same as css font-weight. Examples: `bold`, `100`                                                       |
|   `lineHeight`   |  font's own  | Line height in px. Defaults to the font's natural line height                                                       |
| `letterSpacing`  |     `''`     | Same as css letter-spacing, e.g. `'2px'` (where the canvas supports it)                                             |
|   `direction`    |    `ltr`     | Text direction; set `'rtl'` for right-to-left text (where the canvas supports it)                                   |
|    `justify`     |   `false`    | Stretch soft-wrapped lines to the full box width. Words are positioned individually — no characters are inserted    |
|    `overflow`    |  `visible`   | What happens past the box height: `visible` draws everything, `hidden` clips lines, `ellipsis` clips and appends `…` |
|    `maxLines`    |      —       | Hard cap on the number of lines, independent of box height. Combine with `overflow: 'ellipsis'` for a `…` marker    |
|     `cache`      |    `true`    | Reuse segment widths from the shared per-font cache. Set `false` for exact per-call measuring with no shared state  |
|     `style`      |      —       | Per-call colors: `{ fill, stroke, strokeWidth }`. Defaults to the context's current `fillStyle`                     |

### Text color and styling

Without `style`, `drawText` uses the context's current fill style:

```js
ctx.fillStyle = '#ff0000'
drawText(ctx, 'Red text', { x: 0, y: 0, width: 200, height: 200 })

// or per call:
drawText(ctx, 'Outlined', {
  x: 0, y: 0, width: 200, height: 200,
  style: { fill: '#fff', stroke: '#0C8CE9', strokeWidth: 2 },
})
```

## Methods

```js
import {
  drawText,
  layoutText,
  drawTextLayout,
  measureText,
  splitText,
  getTextHeight,
} from 'canvas-txt'
```

| Method                                   | Description                                                                                                                                                     |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `drawText(ctx, text, config)`            | Lay out and draw text in one call. Returns `{ height, width, lines }`                                                                                           |
| `layoutText(ctx, text, config)`          | The layout half: returns a `TextLayout` with positioned lines (`{ text, x, y, width, words }`), total size, and a `clipped` flag. Doesn't draw anything          |
| `drawTextLayout(ctx, layout, { x, y })`  | The paint half: draws a cached `TextLayout` at a position. Repaint as often as you like without re-measuring                                                     |
| `measureText(ctx, text, config)`         | Shorthand when you only need dimensions: returns `{ lines, width, height }`                                                                                     |
| `splitText({ ctx, text, width })`        | Just the wrapped lines as `string[]`, using the context's current font                                                                                          |
| `getTextHeight({ ctx, text, style })`    | Height of `text` under a CSS font string, using real font metrics ([ctx.font docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font)) |
| `clearMeasurementCache()`                | Flush the shared width cache — call after web fonts finish loading                                                                                              |

## Contributing

The repo is a pnpm workspace: the library lives in
[`packages/canvas-txt`](./packages/canvas-txt), the demo site in
[`apps/docs`](./apps/docs).

```bash
pnpm install
pnpm dev        # demo playground with the library hot-reloading
pnpm test       # vitest against real canvas metrics (node-canvas)
pnpm build      # esm + cjs + iife + d.ts
```
