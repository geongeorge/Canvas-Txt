import { getTextStyle } from "./get-style"
import { Word } from "./models"

interface GetWordHeightProps {
  ctx: CanvasRenderingContext2D
  word: Word
}

interface GetTextHeightProps {
  ctx: CanvasRenderingContext2D
  text: string

  /**
   * CSS font. Same syntax as CSS font specifier. If not specified, current `ctx` font
   *  settings/styles are used.
   */
  style?: string
}

const getHeight = function(ctx: CanvasRenderingContext2D, text: string, style?: string) {
  const previousTextBaseline = ctx.textBaseline
  const previousFont = ctx.font

  ctx.textBaseline = 'bottom'
  if (style) {
    ctx.font = style
  }
  const { actualBoundingBoxAscent: height } = ctx.measureText(text)

  // Reset baseline
  ctx.textBaseline = previousTextBaseline
  if (style) {
    ctx.font = previousFont
  }

  return height
}

export function getWordHeight({
  ctx,
  word,
}: GetWordHeightProps) {
  return getHeight(ctx, word.text, word.format && getTextStyle(word.format))
}

export function getTextHeight({
  ctx,
  text,
  style,
}: GetTextHeightProps) {
  return getHeight(ctx, text, style)
}
