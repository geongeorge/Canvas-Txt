<div align="center">
<h1>Canvas Txt</h1>
<blockquote>
The better way to render text on HTML5 Canvas
</blockquote>

#### A library to print multiline text on HTML5 canvas with better line breaks and alignments 🆎
</div>

## Demo

See Demo: [Here](http://canvas-txt.geongeorge.com)

## Install
```
npm install canvas-txt --save
```

# Usage

```html
<canvas id="myCanvas" width="500" height="500"></canvas>
```

## Webpack
```javascript
import canvasTxt from "canvas-txt";

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var txt = "Lorem ipsum dolor sit amet";

canvasTxt.textSize = 24;

canvasTxt.drawText(ctx,txt,100,200,200,200);
//canvasTxt.drawText(ctx,txt,x,y,width,height);
```

## CDN
```html
<script src="//unpkg.com/canvas-txt"></script>
```
```javascript
var canvasTxt = window.canvasTxt.default;
/// ...remaining same as webpack
```

![](https://i.imgur.com/qV2x2zV.jpg)

## Properties

| Properties| Default  | Description      |
| :---------: |:------:| :--------------|
| `debug`      | `false` | Shows the border and align gravity for debugging purposes |
| `align`      | `center`      |  Text align. Other possible values: `left`, `right` |
| `textSize` | `14`      |    Font size of the text in px  |
| `font` | `Arial`      |    Font family of the text  |
| `lineHeight` | `null`      |   Line height of the text, if set to null it tries to  auto-detect the value  |

## Methods
| Method| Description      |
| :--------- | :--------------|
| `drawText(ctx,text,x,y,width,height)`      | To draw the text to the canvas |

## Example

```javascript
import canvasTxt from "canvas-txt";

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

//You can use \n to define custom line breaks
var txt = "Lorem \nipsum dolor sit amet";

//You can also use other methods alongside this
ctx.fillStyle = "#ff0000"; //red color text

canvasTxt.font = "Verdana";
canvasTxt.textSize = 20;
canvasTxt.align = "left";
canvasTxt.lineHeight = 60;
canvasTxt.debug = true; //shows debug info
canvasTxt.drawText(ctx,txt,100,200,200,200)

```