import { splitWords, splitText, textToWords } from './lib/split-text'
import { getTextHeight } from './lib/text-height'
import { getTextStyle, getTextFormat } from './lib/get-style'
import { CanvasTextConfig, Text } from './lib/models'

function drawText(
  ctx: CanvasRenderingContext2D,
  text: Text,
  config: CanvasTextConfig
) {
  const format = getTextFormat({
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    fontStyle: config.fontStyle,
    fontVariant: config.fontVariant,
    fontWeight: config.fontWeight,
  })

  const { lines: richLines, height: totalHeight, textBaseline, textAlign } = splitWords({
    ctx,
    words: Array.isArray(text) ? text : textToWords(text),
    inferWhitespace: config.inferWhitespace,
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    align: config.align,
    vAlign: config.vAlign,
    justify: config.justify,
    lineHeight: config.lineHeight,
    format,
  });

  ctx.save()
  ctx.textAlign = textAlign
  ctx.textBaseline = textBaseline
  ctx.font = getTextStyle(format)

  richLines.forEach((line) => {
    line.forEach((pw) => {
      if (!pw.isWhitespace) {
        if (pw.word.format) {
          ctx.save()
          ctx.font = getTextStyle(pw.word.format)
        }
        ctx.fillText(pw.word.text, pw.x, pw.y)
        if (pw.word.format) {
          ctx.restore()
        }
      }
    })
  })

  if (config.debug) {
    const { width, height, x, y } = config
    const xEnd = x + width
    const yEnd = y + height

    let textAnchor: number
    if (config.align === 'right') {
      textAnchor = xEnd
    } else if (config.align === 'left') {
      textAnchor = x
    } else {
      textAnchor = x + width / 2
    }

    let debugY = y
    if (config.vAlign === 'bottom') {
      debugY = yEnd
    } else if (config.vAlign === 'middle') {
      debugY = y + height / 2
    }

    const debugColor = '#0C8CE9'

    // Text box
    ctx.lineWidth = 1
    ctx.strokeStyle = debugColor
    ctx.strokeRect(x, y, width, height)

    ctx.lineWidth = 1

    if (!config.align || config.align === 'center') {
      // Horizontal Center
      ctx.strokeStyle = debugColor
      ctx.beginPath()
      ctx.moveTo(textAnchor, y)
      ctx.lineTo(textAnchor, yEnd)
      ctx.stroke()
    }

    if (!config.vAlign || config.vAlign === 'middle') {
      // Vertical Center
      ctx.strokeStyle = debugColor
      ctx.beginPath()
      ctx.moveTo(x, debugY)
      ctx.lineTo(xEnd, debugY)
      ctx.stroke()
    }
  }

  ctx.restore()

  return { height: totalHeight }
}

export { drawText, splitText, splitWords, textToWords, getTextHeight }
