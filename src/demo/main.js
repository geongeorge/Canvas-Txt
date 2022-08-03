import canvasTxt from '../canvas-txt'

const c = document.getElementById('myCanvas')
const ctx = c.getContext('2d')

const txt =
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

console.log(`Total height = ${height}`)
