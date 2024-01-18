import { splitWords, splitText } from './lib/split-text'
import { getTextHeight } from './lib/text-height'
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, getStyle } from './lib/get-style'
import { CanvasTextConfig, Text } from './lib/models'

const defaultConfig: Omit<CanvasTextConfig, 'x' | 'y' | 'width' | 'height'> = {
  debug: false,
  align: 'center',
  vAlign: 'middle',
  fontSize: DEFAULT_FONT_SIZE,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: DEFAULT_FONT_FAMILY,
  justify: false,
}

function drawText(
  ctx: CanvasRenderingContext2D,
  myText: Text,
  inputConfig: CanvasTextConfig
) {
  if (Array.isArray(myText)) {
    throw new Error('Word[] support not yet implemented')
  }

  const { width, height, x, y } = inputConfig
  const config = { ...defaultConfig, ...inputConfig }
  const ctxFontSize = config.fontSize ?? DEFAULT_FONT_SIZE

  if (width <= 0 || height <= 0 || ctxFontSize <= 0) {
    // width or height or font size cannot be 0
    return { height: 0 }
  }

  ctx.save()

  // End points
  const xEnd = x + width
  const yEnd = y + height

  const style = getStyle(config)
  ctx.font = style

  let txtY = y + height / 2 + ctxFontSize / 2

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

  const charHeight = config.lineHeight
    ? config.lineHeight
    : getTextHeight({ ctx, text: 'M', style })

  // DEBUG TODO: this is really ugly, could be more elegant; just a POC...
  const textArray = Array.isArray(myText) ? undefined : splitText({
    ctx,
    text: myText,
    justify: !!config.justify,
    width,
  })
  const richArray = Array.isArray(myText) ? splitWords({
    ctx,
    words: myText,
    justify: !!config.justify,
    width,
  }) : undefined;

  const vHeight = charHeight * (textArray ? textArray.length - 1 : richArray?.lines.length - 1)
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

  if (textArray) {
    // print all lines of text
    textArray.forEach((txtline) => {
      txtline = txtline.trim()
      ctx.fillText(txtline, textAnchor, txtY)
      txtY += charHeight
    })
  } else {
    // DEBUG TODO: render richArray...
  }

  if (config.debug) {
    const debugColor = '#0C8CE9'

    // Text box
    ctx.lineWidth = 1
    ctx.strokeStyle = debugColor
    ctx.strokeRect(x, y, width, height)

    ctx.lineWidth = 1
    // Horizontal Center
    ctx.strokeStyle = debugColor
    ctx.beginPath()
    ctx.moveTo(textAnchor, y)
    ctx.lineTo(textAnchor, yEnd)
    ctx.stroke()
    // Vertical Center
    ctx.strokeStyle = debugColor
    ctx.beginPath()
    ctx.moveTo(x, debugY)
    ctx.lineTo(xEnd, debugY)
    ctx.stroke()
  }

  const textHeight = vHeight + charHeight

  ctx.restore()

  return { height: textHeight }
}

export { drawText, splitText, splitWords, getTextHeight }
