<div align="center">
<h1>Canvas Txt</h1>
<blockquote>
Better way to render text on the HTML5 Canvas
</blockquote>

<p align="center">

<img alt="NPM" src="https://img.shields.io/bundlephobia/minzip/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/v/canvas-txt?style=flat-square">

<img alt="NPM" src="https://img.shields.io/npm/l/canvas-txt?style=flat-square">

</p>

#### A Miniscule library to render text on HTML5 Canvas with ZERO dependencies 🆎

<img src="https://i.imgur.com/JWAC6GS.png" width=300>

</div>

## Features

- [x] Multiline text
- [x] Auto line breaks
- [x] Horizontal Align
- [x] Vertical Align
- [x] Easy Debugging

## Demo

See Demo: [Here](http://canvas-txt.geongeorge.com)

## Install

```
npm install canvas-txt --save

or

yarn add canvas-txt
```

# Usage

```html
<canvas id="myCanvas" width="500" height="500"></canvas>
```

## Webpack

```javascript
import canvasTxt from 'canvas-txt'

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

var txt = 'Lorem ipsum dolor sit amet'

canvasTxt.fontSize = 24

canvasTxt.drawText(ctx, txt, 100, 200, 200, 200)
//canvasTxt.drawText(ctx,txt,x,y,width,height);
```

## CDN

See fiddle : <a href="https://jsfiddle.net/geongeorgek/9bamges1/8/">here</a>

```html
<script src="https://unpkg.com/canvas-txt"></script>
```

```javascript
var canvasTxt = window.canvasTxt.default
/// ...remaining same as webpack
```

![](https://i.imgur.com/qV2x2zV.jpg)

## Properties

|   Properties    | Default  | Description                                                               |
| :-------------: | :------: | :------------------------------------------------------------------------ |
|     `debug`     | `false`  | Shows the border and align gravity for debugging purposes                 |
|     `align`     | `center` | Text align. Other possible values: `left`, `right`                        |
| `verticalAlign` | `middle` | Text vertical align. Other possible values: `top`, `bottom`               |
|   `fontSize`    |   `14`   | Font size of the text in px                                               |
|     `font`      | `Arial`  | Font family of the text                                                   |
|  `lineHeight`   |  `null`  | Line height of the text, if set to null it tries to auto-detect the value |

## Methods

| Method                                | Description                    |
| :------------------------------------ | :----------------------------- |
| `drawText(ctx,text,x,y,width,height)` | To draw the text to the canvas |

## Example

```javascript
import canvasTxt from 'canvas-txt'

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

//You can use \n to define custom line breaks
var txt = 'Lorem \nipsum dolor sit amet'

//You can also use other methods alongside this
ctx.fillStyle = '#ff0000' //red color text

canvasTxt.font = 'Verdana'
canvasTxt.fontSize = 20
canvasTxt.align = 'left'
canvasTxt.lineHeight = 60
canvasTxt.debug = true //shows debug info
canvasTxt.drawText(ctx, txt, 100, 200, 200, 200)
```
