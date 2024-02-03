import { specToJson, splitWords, splitText, textToWords, wordsToJson } from './lib/split-text'
import { getTextHeight, getWordHeight } from './lib/text-height'
import { getTextStyle, getTextFormat, DEFAULT_FONT_COLOR } from './lib/get-style'
import { CanvasRenderContext, CanvasTextConfig, Text } from './lib/models'

function drawText(
  ctx: CanvasRenderContext,
  text: Text,
  config: CanvasTextConfig
) {
  const baseFormat = getTextFormat({
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    fontStyle: config.fontStyle,
    fontVariant: config.fontVariant,
    fontWeight: config.fontWeight,
  })

  const { lines: richLines, height: totalHeight, textBaseline, textAlign } = splitWords({
    ctx,
    words: Array.isArray(text) ? text : textToWords(text),
    inferWhitespace: Array.isArray(text)
      ? (config.inferWhitespace === undefined || config.inferWhitespace)
      : undefined, // ignore since `text` is a string; we assume it already has all the whitespace it needs
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    align: config.align,
    vAlign: config.vAlign,
    justify: config.justify,
    format: baseFormat,
  });

  ctx.save()
  ctx.textAlign = textAlign
  ctx.textBaseline = textBaseline
  ctx.font = getTextStyle(baseFormat)
  ctx.fillStyle = baseFormat.fontColor || DEFAULT_FONT_COLOR

  richLines.forEach((line) => {
    line.forEach((pw) => {
      if (!pw.isWhitespace) {
        // NOTE: don't use the `pw.word.format` as this could be incomplete; use `pw.format`
        //  if it exists as this will always be the __full__ TextFormat used to measure the
        //  Word, and so should be what is used to render it
        if (pw.format) {
          ctx.save()
          ctx.font = getTextStyle(pw.format)
          if (pw.format.fontColor) {
            ctx.fillStyle = pw.format.fontColor
          }
        }
        ctx.fillText(pw.word.text, pw.x, pw.y)
        if (pw.format) {
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

export {
  drawText,
  specToJson,
  splitText,
  splitWords,
  textToWords,
  wordsToJson,
  getTextHeight,
  getWordHeight,
  getTextStyle,
  getTextFormat,
}
export * from './lib/models';
