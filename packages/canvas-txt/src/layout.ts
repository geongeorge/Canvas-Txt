import { buildFont } from './font'
import { wrapText, segmentGraphemes, type Measure } from './wrap'
import {
  getSegmentCache,
  cacheSegmentWidth,
  getCachedFontMetrics,
  setCachedFontMetrics,
  getCachedLayout,
  setCachedLayout,
} from './cache'
import type {
  LayoutConfig,
  LayoutLine,
  LayoutWord,
  TextContext,
  TextLayout,
} from './types'

const ELLIPSIS = '…'

/** Resolve defaults field by field — `??` also neutralizes explicitly-passed
 * `undefined` values, and this stays off the allocation-heavy
 * spread/Object.entries path since it runs on every layout call. */
function resolveConfig(config: LayoutConfig) {
  return {
    width: config.width,
    height: config.height,
    font: config.font ?? 'Arial',
    fontSize: config.fontSize ?? 14,
    fontWeight: config.fontWeight ?? '',
    fontStyle: config.fontStyle ?? '',
    fontVariant: config.fontVariant ?? '',
    lineHeight: config.lineHeight,
    letterSpacing: config.letterSpacing,
    direction: config.direction,
    align: config.align ?? 'center',
    vAlign: config.vAlign ?? 'middle',
    justify: config.justify ?? false,
    overflow: config.overflow ?? 'visible',
    maxLines: config.maxLines,
    cache: config.cache ?? true,
  }
}

type ResolvedConfig = ReturnType<typeof resolveConfig>

interface FontMetrics {
  ascent: number
  descent: number
  height: number
}

/** Font metrics from the context's *current* font. */
function fontMetrics(ctx: TextContext): FontMetrics {
  // 'Mg' samples both an ascender and a descender for the actualBoundingBox
  // fallback; fontBoundingBox (when available) ignores the sample anyway.
  const m = ctx.measureText('Mg')
  const ascent = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent
  return { ascent, descent, height: ascent + descent }
}

function ellipsize(line: string, measure: Measure, width: number): string {
  if (measure(line + ELLIPSIS) <= width) return line + ELLIPSIS
  const graphemes = segmentGraphemes(line)
  while (graphemes.length > 0) {
    graphemes.pop()
    const candidate = graphemes.join('').trimEnd() + ELLIPSIS
    if (measure(candidate) <= width) return candidate
  }
  return ELLIPSIS
}

/** Word positions stretching a line to the full box width, or null when
 * the line has fewer than two words or already fills the box. */
function justifyWords(
  line: string,
  measure: Measure,
  width: number
): LayoutWord[] | null {
  const chunks = line.split(/\s+/).filter(Boolean)
  if (chunks.length < 2) return null

  const wordWidths = chunks.map(measure)
  const totalWordWidth = wordWidths.reduce((sum, w) => sum + w, 0)
  const gap = (width - totalWordWidth) / (chunks.length - 1)
  if (gap <= 0) return null

  const words: LayoutWord[] = []
  let x = 0
  for (let i = 0; i < chunks.length; i++) {
    words.push({ text: chunks[i], x })
    x += wordWidths[i] + gap
  }
  return words
}

function freezeLayout(layout: TextLayout): TextLayout {
  for (const line of layout.lines) {
    if (line.words) {
      for (const word of line.words) Object.freeze(word)
      Object.freeze(line.words)
    }
    Object.freeze(line)
  }
  Object.freeze(layout.lines)
  return Object.freeze(layout)
}

const KEY_SEP = ''

function layoutMemoKey(
  text: string,
  cfg: ResolvedConfig,
  font: string,
  letterSpacing: string,
  direction: string
): string {
  return (
    text +
    KEY_SEP +
    cfg.width +
    KEY_SEP +
    (cfg.height ?? '') +
    KEY_SEP +
    font +
    KEY_SEP +
    (cfg.lineHeight ?? '') +
    KEY_SEP +
    letterSpacing +
    KEY_SEP +
    direction +
    KEY_SEP +
    cfg.align +
    KEY_SEP +
    cfg.vAlign +
    KEY_SEP +
    (cfg.justify ? 1 : 0) +
    KEY_SEP +
    cfg.overflow +
    KEY_SEP +
    (cfg.maxLines ?? '')
  )
}

/**
 * Lay text out inside a box without drawing anything. Pure with respect to
 * the context: every context property it touches is restored before
 * returning. The result can be painted any number of times with
 * `drawTextLayout`, cached across frames, hit-tested, or inspected.
 *
 * Layouts and segment widths are memoized in module-level caches by default
 * (see `clearMeasurementCache`); returned layouts are frozen. Pass
 * `cache: false` to measure exactly, per call, with no shared state — those
 * results are not frozen.
 */
export function layoutText(
  ctx: TextContext,
  text: string,
  config: LayoutConfig
): TextLayout {
  const cfg = resolveConfig(config)
  const font = buildFont(cfg)
  const useCache = cfg.cache !== false

  // Widths depend on the context's effective letterSpacing/direction: the
  // config's value when set, whatever the context carries otherwise.
  const effLetterSpacing = cfg.letterSpacing ?? ctx.letterSpacing ?? ''
  const effDirection = cfg.direction ?? ctx.direction ?? ''

  let memoKey: string | undefined
  if (useCache) {
    memoKey = layoutMemoKey(text, cfg, font, effLetterSpacing, effDirection)
    const memoized = getCachedLayout(memoKey)
    if (memoized !== undefined) return memoized as TextLayout
  }

  const prevFont = ctx.font
  const prevLetterSpacing = ctx.letterSpacing
  const prevDirection = ctx.direction
  ctx.font = font
  if (cfg.letterSpacing !== undefined && 'letterSpacing' in ctx) {
    ctx.letterSpacing = cfg.letterSpacing
  }
  if (cfg.direction !== undefined && 'direction' in ctx) {
    ctx.direction = cfg.direction
  }

  try {
    const cacheKey = `${font}|${effLetterSpacing}|${effDirection}`
    const segmentCache = useCache
      ? getSegmentCache(cacheKey)
      : new Map<string, number>()

    const measureSeg: Measure = (s) => {
      let w = segmentCache.get(s)
      if (w === undefined) {
        w = ctx.measureText(s).width
        cacheSegmentWidth(segmentCache, s, w)
      }
      return w
    }

    // Exact mode measures assembled candidate lines; dedupe within the call.
    let measureLine: Measure | undefined
    const lineCache = new Map<string, number>()
    const measureLineExact: Measure = (s) => {
      let w = lineCache.get(s)
      if (w === undefined) {
        w = ctx.measureText(s).width
        lineCache.set(s, w)
      }
      return w
    }
    if (!useCache) measureLine = measureLineExact

    const paragraphs = wrapText(text, {
      width: cfg.width,
      measureSeg,
      measureLine,
    })

    // Flatten, remembering which lines are soft-wrapped (candidates for
    // justification — the last line of each paragraph is a hard break).
    let flat = paragraphs.flatMap((para) =>
      para.map((line, i) => ({
        text: line.text,
        width: line.width,
        justified: cfg.justify && i < para.length - 1,
      }))
    )

    let metrics = useCache ? getCachedFontMetrics(cacheKey) : undefined
    if (!metrics) {
      metrics = fontMetrics(ctx)
      if (useCache) setCachedFontMetrics(cacheKey, metrics)
    }
    const lineHeight = cfg.lineHeight ?? metrics.height

    let limit = cfg.maxLines ?? Infinity
    if (cfg.overflow !== 'visible' && cfg.height !== undefined) {
      limit = Math.min(limit, Math.floor(cfg.height / lineHeight))
    }

    let clipped = false
    if (flat.length > limit) {
      flat = flat.slice(0, Math.max(limit, 0))
      clipped = true
      if (cfg.overflow === 'ellipsis' && flat.length > 0) {
        const last = flat[flat.length - 1]
        // Precision matters right at the edge — always measure the real line
        last.text = ellipsize(last.text, measureLineExact, cfg.width)
        last.width = measureLineExact(last.text)
        last.justified = false
      }
    }

    const textHeight = flat.length * lineHeight
    const boxHeight = cfg.height ?? textHeight
    let offsetTop = 0
    if (cfg.vAlign === 'middle') offsetTop = (boxHeight - textHeight) / 2
    else if (cfg.vAlign === 'bottom') offsetTop = boxHeight - textHeight

    // Half-leading, like CSS: extra line height is split above and below.
    const leading = lineHeight - metrics.height

    let maxWidth = 0
    const lines: LayoutLine[] = flat.map((line, i) => {
      const words = line.justified
        ? justifyWords(line.text, measureSeg, cfg.width)
        : null
      const width = words ? cfg.width : line.width
      maxWidth = Math.max(maxWidth, width)

      let x = 0
      if (cfg.align === 'center') x = (cfg.width - width) / 2
      else if (cfg.align === 'right') x = cfg.width - width

      const y = offsetTop + i * lineHeight + leading / 2 + metrics.ascent
      return { text: line.text, x, y, width, words }
    })

    const layout: TextLayout = {
      lines,
      width: maxWidth,
      height: textHeight,
      lineHeight,
      font,
      letterSpacing: cfg.letterSpacing,
      direction: cfg.direction,
      clipped,
    }

    if (memoKey !== undefined) {
      // Memoized layouts are shared between callers — freeze so an
      // accidental mutation throws instead of corrupting the cache.
      freezeLayout(layout)
      setCachedLayout(memoKey, layout)
    }
    return layout
  } finally {
    ctx.font = prevFont
    if (prevLetterSpacing !== undefined && 'letterSpacing' in ctx) {
      ctx.letterSpacing = prevLetterSpacing
    }
    if (prevDirection !== undefined && 'direction' in ctx) {
      ctx.direction = prevDirection
    }
  }
}
