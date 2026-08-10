import { layoutText } from './layout'
import { wrapText } from './wrap'
import {
  getSegmentCache,
  cacheSegmentWidth,
  getCachedSplit,
  setCachedSplit,
} from './cache'
import type { LayoutConfig, TextContext } from './types'

export type MeasureTextConfig = Omit<
  LayoutConfig,
  'height' | 'overflow' | 'align' | 'vAlign'
>

/**
 * Lays out the text exactly like drawText would — same wrapping, same line
 * height — without drawing anything. Useful for sizing a canvas before
 * rendering.
 */
export function measureText(
  ctx: TextContext,
  text: string,
  config: MeasureTextConfig
): { lines: string[]; width: number; height: number } {
  const layout = layoutText(ctx, text, config)
  return {
    lines: layout.lines.map((line) => line.text),
    width: layout.width,
    height: layout.height,
  }
}

export interface SplitTextProps {
  ctx: TextContext
  text: string
  width: number
  /** @deprecated v5 justifies at paint time; this flag is ignored */
  justify?: boolean
  /** Set `false` to bypass the module-level width cache. Default `true` */
  cache?: boolean
}

/**
 * Split text into wrapped lines using the context's current font.
 * Kept for v4 compatibility — prefer `layoutText`, which also gives you
 * positions and metrics.
 */
export function splitText({
  ctx,
  text,
  width,
  cache = true,
}: SplitTextProps): string[] {
  // splitText measures with the context's current state, so effective
  // letterSpacing/direction must key the caches too
  const stateKey = `${ctx.font}|${ctx.letterSpacing ?? ''}|${
    ctx.direction ?? ''
  }`

  let memoKey: string | undefined
  if (cache) {
    memoKey = `${stateKey}${width}${text}`
    const memoized = getCachedSplit(memoKey)
    if (memoized !== undefined) return memoized as string[]
  }

  const segmentCache = cache
    ? getSegmentCache(stateKey)
    : new Map<string, number>()
  const measureSeg = (s: string) => {
    let w = segmentCache.get(s)
    if (w === undefined) {
      w = ctx.measureText(s).width
      cacheSegmentWidth(segmentCache, s, w)
    }
    return w
  }

  let measureLine: ((s: string) => number) | undefined
  if (!cache) {
    const lineCache = new Map<string, number>()
    measureLine = (s: string) => {
      let w = lineCache.get(s)
      if (w === undefined) {
        w = ctx.measureText(s).width
        lineCache.set(s, w)
      }
      return w
    }
  }

  const lines = wrapText(text, { width, measureSeg, measureLine })
    .flat()
    .map((line) => line.text)
  if (memoKey !== undefined) {
    setCachedSplit(memoKey, Object.freeze(lines))
  }
  return lines
}

interface GetTextHeightProps {
  ctx: TextContext
  text: string
  style: string
}

/**
 * Height of `text` rendered with the given CSS font string. Uses the font's
 * real line box where the environment exposes it, falling back to the inked
 * bounding box of `text`.
 */
export function getTextHeight({ ctx, text, style }: GetTextHeightProps): number {
  const prevBaseline = ctx.textBaseline
  const prevFont = ctx.font
  ctx.textBaseline = 'bottom'
  ctx.font = style
  const metrics = ctx.measureText(text)
  const height =
    metrics.fontBoundingBoxAscent !== undefined &&
    metrics.fontBoundingBoxDescent !== undefined
      ? metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
      : metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  ctx.textBaseline = prevBaseline
  ctx.font = prevFont
  return height
}
