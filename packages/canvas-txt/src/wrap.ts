export type Measure = (text: string) => number

export interface WrappedLine {
  text: string
  width: number
}

export interface WrapOptions {
  width: number
  /** Width of a single segment (word, whitespace run, or grapheme). */
  measureSeg: Measure
  /**
   * Exact whole-line measuring. When provided, fit tests measure the
   * assembled candidate line instead of summing segment widths — slower,
   * but includes kerning across segment boundaries.
   */
  measureLine?: Measure
}

let wordSegmenter: Intl.Segmenter | undefined
let graphemeSegmenter: Intl.Segmenter | undefined

function segmentWords(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    wordSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'word' })
    return Array.from(wordSegmenter.segment(text), (s) => s.segment)
  }
  // Fallback: split on whitespace runs, keeping them as segments
  return text.split(/(\s+)/).filter((s) => s !== '')
}

export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    graphemeSegmenter ??= new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    })
    return Array.from(graphemeSegmenter.segment(text), (s) => s.segment)
  }
  // Fallback: code points (still safe for surrogate pairs)
  return Array.from(text)
}

/**
 * Whitespace test for word-granularity segments without allocating.
 * UAX-29 never mixes whitespace and non-whitespace in one segment, so the
 * first char is decisive; anything that could be whitespace falls back to
 * the exact trim() check.
 */
function isWhitespaceSegment(segment: string): boolean {
  if (segment === ' ') return true
  const c = segment.charCodeAt(0)
  // 0x21..0x167F excluding NBSP (0xA0) is guaranteed non-whitespace
  if (c > 0x20 && c !== 0xa0 && c < 0x1680) return false
  return segment.trim() === ''
}

/** Break a single token that is wider than the box, at grapheme boundaries. */
function breakToken(token: string, opts: WrapOptions): WrappedLine[] {
  const { width, measureSeg, measureLine } = opts
  const parts: WrappedLine[] = []
  let current = ''
  let currentWidth = 0
  for (const grapheme of segmentGraphemes(token)) {
    const candidateWidth = measureLine
      ? measureLine(current + grapheme)
      : currentWidth + measureSeg(grapheme)
    if (current !== '' && candidateWidth > width) {
      parts.push({ text: current, width: currentWidth })
      current = grapheme
      currentWidth = measureLine ? measureLine(grapheme) : measureSeg(grapheme)
    } else {
      current += grapheme
      currentWidth = candidateWidth
    }
  }
  parts.push({ text: current, width: currentWidth })
  return parts
}

function wrapParagraph(paragraph: string, opts: WrapOptions): WrappedLine[] {
  const { width, measureSeg, measureLine } = opts

  const whole = paragraph.trim()
  if (whole === '') return [{ text: '', width: 0 }]
  if (measureLine) {
    // Exact mode can answer "does the whole paragraph fit?" with one measure
    const wholeWidth = measureLine(whole)
    if (wholeWidth <= width) return [{ text: whole, width: wholeWidth }]
  }

  const lines: WrappedLine[] = []
  let lineText = ''
  let lineWidth = 0
  // Whitespace runs are held back until the next word commits to this line,
  // so trailing spaces are dropped at breaks and never measured into a line.
  let pendingText = ''
  let pendingWidth = 0

  const flush = () => {
    if (lineText !== '') lines.push({ text: lineText, width: lineWidth })
    lineText = ''
    lineWidth = 0
    pendingText = ''
    pendingWidth = 0
  }

  const startLine = (segment: string, segmentWidth: number) => {
    if (segmentWidth > width) {
      const parts = breakToken(segment, opts)
      for (const part of parts.slice(0, -1)) lines.push(part)
      const last = parts[parts.length - 1]
      lineText = last.text
      lineWidth = last.width
    } else {
      lineText = segment
      lineWidth = segmentWidth
    }
  }

  for (const segment of segmentWords(paragraph)) {
    if (isWhitespaceSegment(segment)) {
      if (lineText === '') continue // never start a line with whitespace
      pendingText += segment
      if (!measureLine) pendingWidth += measureSeg(segment)
      continue
    }

    const segmentWidth = measureSeg(segment)
    if (lineText === '') {
      startLine(segment, segmentWidth)
      continue
    }

    const candidateWidth = measureLine
      ? measureLine(lineText + pendingText + segment)
      : lineWidth + pendingWidth + segmentWidth
    if (candidateWidth <= width) {
      lineText += pendingText + segment
      lineWidth = candidateWidth
      pendingText = ''
      pendingWidth = 0
    } else {
      flush()
      startLine(segment, segmentWidth)
    }
  }
  flush()

  if (lines.length === 0) lines.push({ text: '', width: 0 })
  return lines
}

/**
 * Wrap text into measured lines. Returns one WrappedLine[] per paragraph
 * (text split on `\n`), so callers can tell soft-wrapped lines from hard
 * breaks — the last line of each paragraph is a hard break.
 */
export function wrapText(text: string, opts: WrapOptions): WrappedLine[][] {
  return text.split('\n').map((p) => wrapParagraph(p, opts))
}
