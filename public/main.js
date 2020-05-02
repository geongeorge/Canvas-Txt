let canvasTxt = window.canvasTxt.default

var c = document.getElementById('myCanvas')
var ctx = c.getContext('2d')

var txt =
  'Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame Lorem ipsum dolor sit ame'

canvasTxt.fontSize = 24
canvasTxt.fontWeight ='100'
canvasTxt.fontStyle = 'oblique'
canvasTxt.fontVariant = 'small-caps'
// canvasTxt.debug = true
canvasTxt.align = 'center'
canvasTxt.vAlign = 'middle'

canvasTxt.drawText(ctx, txt, 120, 120, 250, 200)
