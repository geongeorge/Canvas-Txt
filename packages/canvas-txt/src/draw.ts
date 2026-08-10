import { layoutText } from './layout'
import type {
  DrawStyle,
  DrawTextConfig,
  TextContext,
  TextLayout,
} from './types'

export interface DrawLayoutOptions {
  /** Left edge of the text box on the canvas */
  x: number
  /** Top edge of the text box on the canvas */
  y: number
  style?: DrawStyle
}

/**
 * Paint a layout produced by `layoutText` at (x, y). The layout can be
 * painted repeatedly (animation frames, fill + stroke passes) without
 * re-measuring. Context state is restored afterwards.
 */
export function drawTextLayout(
  ctx: TextContext,
  layout: TextLayout,
  { x, y, style }: DrawLayoutOptions
): void {
  const prevFont = ctx.font
  const prevAlign = ctx.textAlign
  const prevBaseline = ctx.textBaseline
  const prevLetterSpacing = ctx.letterSpacing
  const prevDirection = ctx.direction
  const prevFill = ctx.fillStyle
  const prevStroke = ctx.strokeStyle
  const prevLineWidth = ctx.lineWidth

  ctx.font = layout.font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (layout.letterSpacing !== undefined && 'letterSpacing' in ctx) {
    ctx.letterSpacing = layout.letterSpacing
  }
  if (layout.direction !== undefined && 'direction' in ctx) {
    ctx.direction = layout.direction
  }
  if (style?.fill !== undefined) ctx.fillStyle = style.fill
  const stroke = style?.stroke !== undefined && typeof ctx.strokeText === 'function'
  if (stroke) {
    ctx.strokeStyle = style!.stroke
    ctx.lineWidth = style!.strokeWidth ?? 1
  }

  try {
    for (const line of layout.lines) {
      if (line.words) {
        for (const word of line.words) {
          ctx.fillText(word.text, x + line.x + word.x, y + line.y)
          if (stroke) ctx.strokeText!(word.text, x + line.x + word.x, y + line.y)
        }
      } else {
        ctx.fillText(line.text, x + line.x, y + line.y)
        if (stroke) ctx.strokeText!(line.text, x + line.x, y + line.y)
      }
    }
  } finally {
    ctx.font = prevFont
    ctx.textAlign = prevAlign
    ctx.textBaseline = prevBaseline
    if (prevLetterSpacing !== undefined && 'letterSpacing' in ctx) {
      ctx.letterSpacing = prevLetterSpacing
    }
    if (prevDirection !== undefined && 'direction' in ctx) {
      ctx.direction = prevDirection
    }
    if (prevFill !== undefined) ctx.fillStyle = prevFill
    if (prevStroke !== undefined) ctx.strokeStyle = prevStroke
    if (prevLineWidth !== undefined) ctx.lineWidth = prevLineWidth
  }
}

const DEBUG_COLOR = '#0C8CE9'

function drawDebug(ctx: TextContext, config: DrawTextConfig): void {
  if (
    !ctx.strokeRect ||
    !ctx.beginPath ||
    !ctx.moveTo ||
    !ctx.lineTo ||
    !ctx.stroke
  ) {
    return
  }
  const { x, y, width, height } = config
  const prevStroke = ctx.strokeStyle
  const prevLineWidth = ctx.lineWidth
  const prevAlpha = ctx.globalAlpha
  ctx.strokeStyle = DEBUG_COLOR
  ctx.lineWidth = 1

  // Text box — the 0.5 offsets keep 1px strokes on the pixel grid so they
  // render as one crisp row instead of blurring across two
  ctx.strokeRect(x + 0.5, y + 0.5, width, height)

  // Alignment guides, dashed and dimmed where the context supports it
  const anchorX =
    config.align === 'left'
      ? x
      : config.align === 'right'
        ? x + width
        : x + width / 2
  const anchorY =
    config.vAlign === 'top'
      ? y
      : config.vAlign === 'bottom'
        ? y + height
        : y + height / 2
  ctx.setLineDash?.([4, 4])
  if (prevAlpha !== undefined) ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(anchorX + 0.5, y)
  ctx.lineTo(anchorX + 0.5, y + height)
  ctx.moveTo(x, anchorY + 0.5)
  ctx.lineTo(x + width, anchorY + 0.5)
  ctx.stroke()
  ctx.setLineDash?.([])
  if (prevAlpha !== undefined) ctx.globalAlpha = prevAlpha

  if (prevStroke !== undefined) ctx.strokeStyle = prevStroke
  if (prevLineWidth !== undefined) ctx.lineWidth = prevLineWidth
}

/**
 * Lay out and draw text inside the box described by config. Convenience
 * wrapper around `layoutText` + `drawTextLayout` — for repeated drawing of
 * the same text, lay out once and paint the layout instead.
 */
export function drawText(
  ctx: TextContext,
  text: string,
  config: DrawTextConfig
): { height: number; width: number; lines: string[] } {
  const fontSize = config.fontSize ?? 14
  if (config.width <= 0 || config.height <= 0 || fontSize <= 0) {
    return { height: 0, width: 0, lines: [] }
  }

  const layout = layoutText(ctx, text, config)
  drawTextLayout(ctx, layout, { x: config.x, y: config.y, style: config.style })
  if (config.debug) drawDebug(ctx, config)

  return {
    height: layout.height,
    width: layout.width,
    lines: layout.lines.map((line) => line.text),
  }
}
