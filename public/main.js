let canvasTxt = window.canvasTxt.default

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

var txt =
  'Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame'

canvasTxt.fontSize = 24
// canvasTxt.debug = true
canvasTxt.align = 'center'
canvasTxt.verticalAlign = 'middle'

canvasTxt.drawText(ctx, txt, 120, 120, 250, 200)
