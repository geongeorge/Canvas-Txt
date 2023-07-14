import splitText from './lib/split-text'
import getTextHeight from './lib/text-height'

export interface CanvasTextConfig {
  width: number
  height: number
  x: number
  y: number
  debug?: boolean
  align?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'middle' | 'bottom'
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  fontVariant?: string
  font?: string
  lineHeight?: number
  justify?: boolean
}

const defaultConfig = {
  debug: false,
  align: 'center',
  vAlign: 'middle',
  fontSize: 14,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: 'Arial',
  lineHeight: null,
  justify: false,
}

function drawText(
  ctx: CanvasRenderingContext2D,
  myText: string,
  inputConfig: CanvasTextConfig
) {
  const { width, height, x, y } = inputConfig
  const config = { ...defaultConfig, ...inputConfig }

  console.log('drawText', config)

  if (width <= 0 || height <= 0 || config.fontSize <= 0) {
    //width or height or font size cannot be 0
    return { height: 0 }
  }

  // End points
  const xEnd = x + width
  const yEnd = y + height

  const { fontStyle, fontVariant, fontWeight, fontSize, font } = config
  const style = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${font}`
  ctx.font = style

  let txtY = y + height / 2 + config.fontSize / 2

  let textAnchor: number

  if (config.align === 'right') {
    textAnchor = xEnd
    ctx.textAlign = 'right'
  } else if (config.align === 'left') {
    textAnchor = x
    ctx.textAlign = 'left'
  } else {
    textAnchor = x + width / 2
    ctx.textAlign = 'center'
  }

  const textArray = splitText({
    ctx,
    text: myText,
    justify: config.justify,
    width,
  })

  const charHeight = config.lineHeight
    ? config.lineHeight
    : getTextHeight({ ctx, text: 'M', style })
  const vHeight = charHeight * (textArray.length - 1)
  const negOffset = vHeight / 2

  let debugY = y
  // Vertical Align
  if (config.vAlign === 'top') {
    ctx.textBaseline = 'top'
    txtY = y
  } else if (config.vAlign === 'bottom') {
    ctx.textBaseline = 'bottom'
    txtY = yEnd - vHeight
    debugY = yEnd
  } else {
    //defaults to center
    ctx.textBaseline = 'bottom'
    debugY = y + height / 2
    txtY -= negOffset
  }
  //print all lines of text
  textArray.forEach((txtline) => {
    txtline = txtline.trim()
    ctx.fillText(txtline, textAnchor, txtY)
    txtY += charHeight
  })

  if (config.debug) {
    // Text box
    ctx.lineWidth = 1
    ctx.strokeStyle = '#0C8CE9'
    ctx.strokeRect(x, y, width, height)

    ctx.lineWidth = 1
    // Horizontal Center
    ctx.strokeStyle = '#0C8CE9'
    ctx.beginPath()
    ctx.moveTo(textAnchor, y)
    ctx.lineTo(textAnchor, yEnd)
    ctx.stroke()
    // Vertical Center
    ctx.strokeStyle = '#0C8CE9'
    ctx.beginPath()
    ctx.moveTo(x, debugY)
    ctx.lineTo(xEnd, debugY)
    ctx.stroke()
  }

  const TEXT_HEIGHT = vHeight + charHeight

  return { height: TEXT_HEIGHT }
}

export { drawText, splitText, getTextHeight }
