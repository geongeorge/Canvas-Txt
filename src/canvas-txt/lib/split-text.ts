import { getTextFormat, getTextStyle } from './get-style'
import { isWhitespace } from './is-whitespace'
import { justifyLine } from './justify'
import {
  PositionWordsProps,
  PositionedWord,
  SplitTextProps,
  SplitWordsProps,
  SplitWordsResults,
  Word,
  WordMap
} from './models'
import { trimLine } from './trim-line'

// Hair space character for precise justification
const HAIR = '\u{200a}'

// for when we're inferring whitespace between words
const SPACE = ' '

/**
 * Splits words into lines based on words that are single newline characters.
 * @param words
 * @param inferWhitespace True if whitespace should be inferred (and injected) based on words;
 *  false if we're to assume the words already include all necessary whitespace.
 * @returns Words expressed as lines.
 */
const splitIntoLines = function(words: Word[], inferWhitespace: boolean): Word[][] {
  const lines: Word[][] = [[]]

  let wasWhitespace = false // true if previous word was whitespace
  words.forEach((word, wordIdx) => {
    // DEBUG TODO: this is likely a naive split (at least based on character?); should at least
    //  think about this more; text format shouldn't matter on a line break, right (hope not)?
    if (word.text.match(/^\n+$/)) {
      for (let i = 0; i < word.text.length; i++) {
        lines.push([])
      }
      wasWhitespace = true
      return // next `word`
    }

    if (isWhitespace(word.text)) {
      // whitespace OTHER THAN newlines since we checked for newlines above
      lines.at(-1)?.push(word)
      wasWhitespace = true
      return // next `word`
    }

    if (word.text === '') {
      return // skip to next `word`
    }

    // looks like a non-empty, non-whitespace word at this point, so if it isn't the first
    //  word and the one before wasn't whitespace, insert a space
    if (inferWhitespace && !wasWhitespace && wordIdx > 0) {
      lines.at(-1)?.push({ text: SPACE })
    }

    lines.at(-1)?.push(word)
    wasWhitespace = false
  })

  return lines
}

/**
 * Helper for `splitWords()` that takes the words that have been wrapped into lines and
 *  determines their positions on canvas for future rendering based on alignment settings.
 * @param params
 * @returns Results to return via `splitWords()`
 */
const positionWords = function({
  wrappedLines,
  wordMap,
  positioning: {
    width: boxWidth,
    height: boxHeight,
    x: boxX,
    y: boxY,
    align,
    vAlign,
  }
}: PositionWordsProps): SplitWordsResults {
  const xEnd = boxX + boxWidth
  const yEnd = boxY + boxHeight

  // max height per line
  const lineHeights = wrappedLines.map(
    (line) =>
      line.reduce(
        (acc, word) => {
          const metrics = wordMap.get(word)! // must exist as every `word` will have been measured
          // NOTE: using __font__ ascent/descent to account for all possible characters in the font
          //  so that lines with ascenders but no descenders, or vice versa, are all properly
          //  aligned to the baseline, and so that lines aren't scrunched
          return Math.max(acc, metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)
        },
        0
      )
  )
  const totalHeight = lineHeights.reduce((acc, h) => acc + h, 0)

  // vertical alignment (defaults to middle)
  let lineY: number
  let textBaseline: CanvasTextBaseline
  if (vAlign === 'top') {
    textBaseline = 'top'
    lineY = boxY
  } else if (vAlign === 'bottom') {
    textBaseline = 'bottom'
    lineY = yEnd - totalHeight
  } else { // middle
    textBaseline = 'top' // YES, using 'top' baseline for 'middle' v-align
    lineY = (boxY + boxHeight / 2) - (totalHeight / 2)
  }

  const lines = wrappedLines.map((line, lineIdx): PositionedWord[] => {
    const lineWidth = line.reduce(
      (acc, word) => acc + (wordMap.get(word)?.width ?? 0),
      0
    )
    const lineHeight = lineHeights[lineIdx]

    // horizontal alignment (defaults to center)
    let lineX: number
    if (align === 'right') {
      lineX = xEnd - lineWidth
    } else if (align === 'left') {
      lineX = boxX
    } else { // center
      lineX = (boxX + boxWidth / 2) - (lineWidth / 2)
    }

    let wordX = lineX
    const posWords = line.map((word): PositionedWord => {
      const metrics = wordMap.get(word)! // must exist as every `word` will have been measured
      const x = wordX

      // NOTE: even for middle vertical alignment, we want to use the __font__ ascent/descent
      //  so that words, per line, are still aligned to the baseline (as much as possible; if
      //  each word has a different font size, then things will still be offset, but for the
      //  same font size, the baseline should match from left to right)
      const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent

      // vertical alignment (defaults to middle)
      let y: number
      if (vAlign === 'top') {
        y = lineY
      } else if (vAlign === 'bottom') {
        y = lineY + lineHeight
      } else { // middle
        y = lineY + (lineHeight - height) / 2
      }

      wordX += metrics.width
      return {
        word,
        x,
        y,
        width: metrics.width,
        height,
        isWhitespace: isWhitespace(word.text)
      }
    })

    lineY += lineHeight
    return posWords
  })

  return {
    lines,
    textBaseline,
    textAlign: 'left', // always per current algorithm
    height: totalHeight
  }
}

/**
 * Splits Words into positioned lines of Words as they need to be rendred in 2D space,
 *  but does not render anything.
 * @param config
 * @returns Lines of positioned words to be rendered, and total height required to
 *  render all lines.
 */
export function splitWords({
  ctx,
  words,
  justify,
  format: baseFormat,
  inferWhitespace = true,
  ...positioning // rest of params are related to positioning
}: SplitWordsProps): SplitWordsResults {
  const wordMap: WordMap = new Map()
  const baseTextFormat = getTextFormat(baseFormat)

  //// text measurement

  const measureText = (word: Word): number => {
    // DEBUG PERF: using the word as the key is very memory-intensive when justifying
    //  text (and also for a really, really long piece of text to render where there's
    //  a lot of repetitive whitespace, and probably repetitive words like 'the', etc);
    //  we should cache metrics based on combination of `word.text` and `word.format`
    //  instead of `word` (which will be different for every single, yet identical in
    //  text and format, justification `HAIR` character, and there will be thousands,
    //  if not millions, for a really long text to render)
    if (wordMap.has(word)) {
      return wordMap.get(word)!.width
    }

    if (word.format) {
      ctx.save()
      ctx.font = getTextStyle(getTextFormat(word.format, baseTextFormat))
    }

    const metrics = ctx.measureText(word.text)
    wordMap.set(word, metrics)

    if (word.format) {
      ctx.restore()
    }

    return metrics.width
  }

  const measureLine = (words: Word[]): number =>
    words.reduce((lineWidth, word) => lineWidth + measureText(word), 0)

  //// main

  ctx.save()

  const initialLines = splitIntoLines(trimLine(words), inferWhitespace)
  const { width: boxWidth } = positioning

  if (
    initialLines.length <= 0 ||
    boxWidth <= 0 ||
    positioning.height <= 0 ||
    (baseFormat && typeof baseFormat.fontSize === 'number' && baseFormat.fontSize <= 0)
  ) {
    // width or height or font size cannot be 0, or there are no lines after trimming
    return { lines: [], textAlign: 'center', textBaseline: 'middle', height: 0 }
  }

  ctx.font = getTextStyle(baseTextFormat)

  const hairWidth = justify ? measureText({ text: HAIR }) : 0
  const wrappedLines: Word[][] = []

  for (const singleLine of initialLines) {
    let lineWidth = measureLine(singleLine)

    // if the line fits, we're done; else, we have to break it down further to fit
    //  as best as we can (i.e. minimum one word per line, no breaks within words,
    //  no leading/pending whitespace)
    if (lineWidth <= boxWidth) {
      wrappedLines.push(singleLine)
      continue
    }

    // shallow clone because we're going to break this line down further to get the best fit
    let tempLine = singleLine.concat()

    let splitPoint: number
    let splitPointWidth: number
    let lineToPrint: Word[] = []

    while (lineWidth > boxWidth) {
      splitPoint = Math.floor(tempLine.length / 2)
      splitPointWidth =
        splitPoint === 0 ? 0 : measureLine(tempLine.slice(0, splitPoint))

      if (splitPointWidth < boxWidth) {
        // try to build it back up to fit the max Words we can
        while (splitPointWidth < boxWidth && splitPoint < tempLine.length) {
          splitPoint++
          splitPointWidth = measureLine(tempLine.slice(0, splitPoint))
        }

        if (splitPointWidth > boxWidth || splitPoint < tempLine.length) {
          // back one because we blew past `boxWidth` either right on the last Word or before
          splitPoint--
        }
      } else if (splitPointWidth > boxWidth) {
        // try to shrink it back down to fit (NOTE that if `splitPoint=1`, it means we're
        //  down to a single Word on the line because we're going to split BEFORE `splitPoint`
        //  per `Array.slice()`...)
        while (splitPointWidth > boxWidth && splitPoint > 0) {
          splitPoint--
          splitPointWidth = measureLine(tempLine.slice(0, splitPoint))
        }

        // in this case, we don't need to correct for a missed Word if we reached the
        //  start of the `tempLine` before we found a width that fit because we'll
        //  correct that below in the fail safe against a `boxWidth` that's too narrow
        //  to fit anything
      }

      // always print at least one word on a line (because the `splitPoint` is the
      //  word immediately AFTER where the split will take place with `Array.slice()`)
      // NOTE: we could hit this if the `boxWidth` is too narrow to fit any Word, and
      //  we have to always consume _at least_ one Word per line, otherwise, we'll get
      //  into an infinite loop because we'll always have Words left to render
      if (splitPoint === 0) {
        splitPoint = 1
      }

      lineToPrint = trimLine(tempLine.slice(0, splitPoint))

      if (justify) {
        lineToPrint = justifyLine({
          measureLine,
          line: lineToPrint,
          spaceWidth: hairWidth,
          spaceChar: HAIR,
          width: boxWidth,
        })

        // make sure any new Words used for justification get measured so we're able to
        //  position them later in positionWords()
        measureLine(lineToPrint)
      }

      wrappedLines.push(lineToPrint)
      tempLine = trimLine(tempLine.slice(splitPoint))
      lineWidth = measureLine(tempLine)
    }

    if (lineWidth > 0) {
      if (justify) {
        lineToPrint = justifyLine({
          measureLine,
          line: tempLine,
          spaceWidth: hairWidth,
          spaceChar: HAIR,
          width: boxWidth,
        })

        // make sure any new Words used for justification get measured so we're able to
        //  position them later in positionWords()
        measureLine(lineToPrint)
      } else {
        lineToPrint = tempLine
      }

      wrappedLines.push(lineToPrint)
    }
  }

  const results = positionWords({
    wrappedLines,
    wordMap,
    fontSize: baseTextFormat.fontSize,
    ctx,
    positioning,
  })

  ctx.restore()
  return results
}

/**
 * Converts a string of text containing words and whitespace, as well as line breaks (newlines),
 *  into a `Word[]` that can be given to `splitWords()`.
 * @param text String to convert into Words.
 * @returns Converted text.
 */
export function textToWords(text: string) {
  const words: Word[] = []

  // split the `text` into a series of Words, preserving whitespace
  let word: Word | undefined = undefined;
  let wasWhitespace = false
  Array.from(text.trim()).forEach((c) => {
    const charIsWhitespace = isWhitespace(c)
    if ((charIsWhitespace && !wasWhitespace) || (!charIsWhitespace && wasWhitespace)) {
      // save current `word`, if any, and start new `word`
      wasWhitespace = charIsWhitespace
      if (word) {
        words.push(word)
      }
      word = { text: c }
    } else {
      // accumulate into current `word`
      if (!word) {
        word = { text: '' }
      }
      word.text += c
    }
  })

  // make sure we have the last word! ;)
  if (word) {
    words.push(word)
  }

  return words
}

/**
 * Splits plain text into lines in the order in which they should be rendered, top-down,
 *  preserving whitespace __only within the text__ (whitespace on either end is trimmed).
 */
export function splitText({
  text,
  ...params
}: SplitTextProps): string[] {
  const words = textToWords(text)

  const results = splitWords({
    ...params,
    words,
    inferWhitespace: false
  })

  return results.lines.map(
    (line) => line.map(({ word: { text } }) => text).join('')
  )
}
