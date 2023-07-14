<div align="center">
<img src="./src/docs/featured.png" width=600 alt="canvas-txt multiline text on html canvas">
<h3>Canvas Txt 📐</h3>
<p>
Transforming Your Canvas with Multiline Magic ✨
</p>

<p align="center">

<img alt="NPM" src="https://img.shields.io/bundlephobia/minzip/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/v/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/l/canvas-txt?style=flat-square">

</p>

#### A Miniscule library to render text on HTML5 Canvas with ZERO dependencies

</div>

## Features

- [x] Multiline text
- [x] Auto line breaks
- [x] Horizontal Align
- [x] Vertical Align
- [x] Justify Align
- [x] Easy Debugging
- [x] Improved Performance

## Demo

See Demo: [Here](https://canvas-txt.geongeorge.com)

## Install

```
yarn add canvas-txt

or

npm i canvas-txt
```

# Usage

```html
<canvas id="myCanvas" width="500" height="500"></canvas>
```

## Webpack

```javascript
import { drawText } from 'canvas-txt'

const c = document.getElementById('myCanvas')
const ctx = c.getContext('2d')

ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)

const txt = 'Lorem ipsum dolor sit amet'

const { height } = drawText(ctx, txt, {
  x: 100,
  y: 200,
  width: 200,
  height: 200,
  fontSize: 24,
})

console.log(`Total height = ${height}`)
```

## Node canvas

See Node js demo in `./src/node-test.ts`

```js
const { createCanvas } = require('canvas')
const { drawText } = require('canvas-txt')
const fs = require('fs')

// Or
// import { createCanvas } from 'canvas'
// import { drawText } from 'canvas-txt'
// import * as fs from 'fs'

function main() {
  const canvas = createCanvas(400, 400)
  const ctx = canvas.getContext('2d')
  const txt = 'Hello World!'

  const { height } = drawText(ctx, txt, {
    x: 100,
    y: 200,
    width: 200,
    height: 200,
    fontSize: 24,
  })

  // Convert the canvas to a buffer in PNG format
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('output.png', buffer)
  console.log(`Total height = ${height}`)
}

main()
```

## CDN

See fiddle : <a href="https://jsfiddle.net/geongeorgek/9bamges1/10/">here</a>

```html
<script src="//unpkg.com/canvas-txt"></script>
```

```javascript
const { drawText, getTextHeight, splitText } = window.canvasTxt
/// ...remaining same
```

![](https://i.imgur.com/qV2x2zV.jpg)

## Properties

|  Properties   |   Default    | Description                                                                    |
| :-----------: | :----------: | :----------------------------------------------------------------------------- |
|    `width`    | **Required** | Width of the text box                                                          |
|   `height`    | **Required** | Height of the text box                                                         |
|      `x`      | **Required** | X position of the text box                                                     |
|      `y`      | **Required** | Y position of the text box                                                     |
|    `debug`    |   `false`    | Shows the border and align gravity for debugging purposes                      |
|    `align`    |   `center`   | Text align. Other possible values: `left`, `right`                             |
|   `vAlign`    |   `middle`   | Text vertical align. Other possible values: `top`, `bottom`                    |
|    `font`     |   `Arial`    | Font family of the text                                                        |
|  `fontSize`   |     `14`     | Font size of the text in px                                                    |
|  `fontStyle`  |     `''`     | Font style, same as css font-style. Examples: `italic`, `oblique 40deg`        |
| `fontVariant` |     `''`     | Font variant, same as css font-variant. Examples: `small-caps`, `slashed-zero` |
| `fontWeight`  |     `''`     | Font weight, same as css font-weight. Examples: `bold`, `100`                  |
| `lineHeight`  |    `null`    | Line height of the text, if set to null it tries to auto-detect the value      |
|   `justify`   |   `false`    | Justify text if `true`, it will insert spaces between words when necessary.    |

## Methods

```js
import { drawText, splitText, getTextHeight } from 'canvas-txt'
```

| Method                                    | Description                                                                                                                                                                                                                     |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `drawText(ctx,text, config)`              | To draw the text to the canvas                                                                                                                                                                                                  |
| `splitText({ ctx, text, justify, width }` | To split the text `{ ctx: CanvasRenderingContext2D, text: string, justify: boolean, width: number }`                                                                                                                            |
| `getTextHeight({ ctx, text, style })`     | To get the height of the text `{ ctx: CanvasRenderingContext2D, text: string, style: string (font style we pass to ctx.font) }` [ctx.font docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) |
