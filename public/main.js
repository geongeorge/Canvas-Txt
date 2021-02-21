let canvasTxt = window.canvasTxt.default

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

var txt =
  'Lorem ipsum Lorem ipsum Lorem ipsum'

canvasTxt.fontSize = 40
canvasTxt.fontWeight = '100'
canvasTxt.fontStyle = 'oblique'
// canvasTxt.fontVariant = 'small-caps'
canvasTxt.debug = true
canvasTxt.align = 'center'
canvasTxt.vAlign = 'middle'
// canvasTxt.justify = true

let { height } = canvasTxt.drawText(ctx, txt, 120, 120, 250, 200)

console.log(`Total height = ${height}`)
