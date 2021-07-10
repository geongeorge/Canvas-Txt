let canvasTxt = window.canvasTxt.default
let createCanvasTxt = window.canvasTxt.createCanvasTxt

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

var txt =
  'Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame'

canvasTxt.fontSize = 24
canvasTxt.fontWeight = '100'
canvasTxt.fontStyle = 'oblique'
canvasTxt.fontVariant = 'small-caps'
// canvasTxt.debug = true
canvasTxt.align = 'center'
canvasTxt.vAlign = 'middle'
// canvasTxt.justify = true

let { height } = canvasTxt.drawText(ctx, txt, 120, 120, 250, 200)

const fontDefault = {
  // debug: true,
  fontWeight: '100',
  fontStyle: 'oblique',
  fontVariant: 'small-caps',
  align: 'center',
  vAlign: 'middle',
}

const presetH1 = createCanvasTxt({...fontDefault, fontSize: 28 });
const presetH5 = createCanvasTxt({...fontDefault, fontSize: 16 });

presetH5.drawText(ctx, txt, 120, 280, 250, 200);
presetH1.drawText(ctx, txt, 120, 20, 250, 100);

console.log(`Total height = ${height}`)
