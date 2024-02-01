import { getTextFormat, getTextStyle } from './get-style'
import { isWhitespace } from './is-whitespace'
import { justifyLine } from './justify'
import {
  PositionWordsProps,
  PositionedWord,
  SplitTextProps,
  SplitWordsProps,
  RenderSpec,
  Word,
  WordMap,
  CanvasTextMetrics
} from './models'
import { trimLine } from './trim-line'

// Hair space character for precise justification
const HAIR = '\u{200a}'

// for when we're inferring whitespace between words
const SPACE = ' '

/**
 * Generates a word hash for use as a key in a `WordMap`.
 * @param word
 * @returns Hash.
 */
const getWordHash = function(word: Word) {
  return `${word.text}${word.format ? JSON.stringify(word.format) : ''}`
}

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
const generateSpec = function({
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
}: PositionWordsProps): RenderSpec {
  const xEnd = boxX + boxWidth
  const yEnd = boxY + boxHeight

  // NOTE: using __font__ ascent/descent to account for all possible characters in the font
  //  so that lines with ascenders but no descenders, or vice versa, are all properly
  //  aligned to the baseline, and so that lines aren't scrunched
  // NOTE: even for middle vertical alignment, we want to use the __font__ ascent/descent
  //  so that words, per line, are still aligned to the baseline (as much as possible; if
  //  each word has a different font size, then things will still be offset, but for the
  //  same font size, the baseline should match from left to right)
  const getHeight = (metrics: CanvasTextMetrics): number =>
    metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent

  // max height per line
  const lineHeights = wrappedLines.map(
    (line) =>
      line.reduce(
        (acc, word) => {
          // NOTE: `metrics` must exist as every `word` MUST have been measured at this point
          const { metrics } = word
          return Math.max(acc, getHeight(metrics!))
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
      // NOTE: `metrics` must exist as every `word` MUST have been measured at this point
      (acc, word) => acc + word.metrics!.width,
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
      // NOTE: `word.metrics` and `wordMap.get(hash)` must exist as every `word` MUST have
      //  been measured at this point

      const hash = getWordHash(word)
      const { format } = wordMap.get(hash)!
      const x = wordX
      const height = getHeight(word.metrics!)

      // vertical alignment (defaults to middle)
      let y: number
      if (vAlign === 'top') {
        y = lineY
      } else if (vAlign === 'bottom') {
        y = lineY + lineHeight
      } else { // middle
        y = lineY + (lineHeight - height) / 2
      }

      wordX += word.metrics!.width
      return {
        word,
        format, // undefined IF base formatting should be used when rendering (i.e. `word.format` is undefined)
        x,
        y,
        width: word.metrics!.width,
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
    width: boxWidth,

    // DEBUG TODO: `totalHeight` is actually ~5px MORE than it should be purely looking at pixels;
    //  not sure why that is, other than the use of `fontBounding*` metrics to calculate word
    //  heights, line heights, and ultimately this total height, which accounts for more than
    //  purely rendered pixels, but is also necessary for proper positioning and avoiding
    //  scrunching the text (e.g. if we were to use `actualBounding*` metrics instead
    height: totalHeight
  }
}

/**
 * Serializes render specs to JSON for storage or for sending via `postMessage()`
 *  between the main thread and a Web Worker thread.
 *
 * This is primarily to help with the fact that `postMessage()` fails if given a native
 *  Canvas `TextMetrics` object to serialize somewhere in its `message` parameter.
 *
 * @param specs
 * @returns Specs serialized as JSON.
 */
export function specToJson(specs: RenderSpec): string {
  // CAREFUL: use a `function`, not an arrow function, as stringify() sets its context to
  //  the object being serialized on each call to the replacer
  return JSON.stringify(specs, function (key, value) {
    if (key === 'metrics' && value && typeof value === 'object') {
      // DEBUG TODO: need better typings here, if possible, so that TSC warns if we aren't
      //  including a property we should be if a new one is needed in the future (i.e. if
      //  a new property is added to the `TextMetricsLike` type)
      // NOTE: TextMetrics objects don't have own-enumerable properties; they only have getters,
      //  so we have to explicitly get the values we care about
      return {
        width: value.width,
        fontBoundingBoxAscent: value.fontBoundingBoxAscent,
        fontBoundingBoxDescent: value.fontBoundingBoxDescent,
      } as CanvasTextMetrics;
    }

    return value
  })
}

/**
 * Serializes a list of Words to JSON for storage or for sending via `postMessage()`
 *  between the main thread and a Web Worker thread.
 *
 * This is primarily to help with the fact that `postMessage()` fails if given a native
 *  Canvas `TextMetrics` object to serialize somewhere in its `message` parameter.
 *
 * @param words
 * @returns Words serialized as JSON.
 */
export function wordsToJson(words: Word[]): string {
  // DEBUG TODO: this is the same replacer implementation as used in specsToJson(); we should
  //  be able to declare the replacer once, but that requires specifying the `this` context to
  //  be something other than `any` so that TSC doesn't complain; figure this out later

  // CAREFUL: use a `function`, not an arrow function, as stringify() sets its context to
  //  the object being serialized on each call to the replacer
  return JSON.stringify(words, function (key, value) {
    if (key === 'metrics' && value && typeof value === 'object') {
      // DEBUG TODO: need better typings here, if possible, so that TSC warns if we aren't
      //  including a property we should be if a new one is needed in the future (i.e. if
      //  a new property is added to the `TextMetricsLike` type)
      // NOTE: TextMetrics objects don't have own-enumerable properties; they only have getters,
      //  so we have to explicitly get the values we care about
      return {
        width: value.width,
        fontBoundingBoxAscent: value.fontBoundingBoxAscent,
        fontBoundingBoxDescent: value.fontBoundingBoxDescent,
      } as CanvasTextMetrics;
    }

    return value
  })
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
}: SplitWordsProps): RenderSpec {
  const wordMap: WordMap = new Map()
  const baseTextFormat = getTextFormat(baseFormat)

  //// text measurement

  const measureText = (word: Word): number => {
    const hash = getWordHash(word);

    if (word.metrics) {
      // assume Word's text and format haven't changed since last measurement and metrics are good

      // make sure we have the metrics and full formatting cached for other identical Words
      if (!wordMap.has(hash)) {
        let format = undefined;
        if (word.format) {
          format = getTextFormat(word.format, baseTextFormat)
        }
        wordMap.set(hash, { metrics: word.metrics, format })
      }

      return word.metrics.width
    }

    // check to see if we have already measured an identical Word
    if (wordMap.has(hash)) {
      const { metrics } = wordMap.get(hash)!; // will be there because of `if(has())` check
      word.metrics = metrics;
      return metrics.width
    }

    let format = undefined
    if (word.format) {
      ctx.save()
      format = getTextFormat(word.format, baseTextFormat)
      ctx.font = getTextStyle(format)
    }

    const metrics = ctx.measureText(word.text)
    word.metrics = metrics
    wordMap.set(hash, { metrics, format })

    if (word.format) {
      ctx.restore()
    }

    return metrics.width
  }

  // measures an entire line's width up to the `boxWidth` as a max, unless `force=true`,
  //  in which case the entire line is measured regardless of `boxWidth`.
  //
  // - Returned `lineWidth` is width up to, but not including, the `splitPoint` (always <= `boxWidth`
  //   unless the first Word is too wide to fit, in which case `lineWidth` will be that Word's
  //   width even though it's > `boxWidth`).
  //   - If `force=true`, will be the full width of the line regardless of `boxWidth`.
  // - Returned `splitPoint` is index into `words` of the Word immediately FOLLOWING the last
  //   Word included in the `lineWidth` (and is `words.length` if all Words were included);
  //  `splitPoint` could also be thought of as the number of `words` included in the `lineWidth`.
  //  - If `force=true`, will always be `words.length`.
  const measureLine = (words: Word[], force: boolean = false): {
    lineWidth: number,
    splitPoint: number
  } => {
    let lineWidth = 0
    let splitPoint = 0
    words.every((word, idx) => {
      const wordWidth = measureText(word)
      if (!force && (lineWidth + wordWidth > boxWidth)) {
        // at minimum, MUST include at least first Word, even if it's wider than box width
        if (idx === 0) {
          splitPoint = 1
          lineWidth = wordWidth
        }
        // else, `lineWidth` already includes at least one Word so this current Word will
        //  be the `splitPoint` such that `lineWidth` remains < `boxWidth`

        return false // break
      }

      splitPoint++
      lineWidth += wordWidth
      return true // next
    });

    return { lineWidth, splitPoint }
  }

  //// main

  ctx.save()

  // start by trimming the `words` to remove any whitespace at either end, then split the `words`
  //  into an initial set of lines dictated by explicit hard breaks, if any (if none, we'll have
  //  one super long line)
  const hardLines = splitIntoLines(trimLine(words).trimmedLine, inferWhitespace)
  const { width: boxWidth } = positioning

  if (
    hardLines.length <= 0 ||
    boxWidth <= 0 ||
    positioning.height <= 0 ||
    (baseFormat && typeof baseFormat.fontSize === 'number' && baseFormat.fontSize <= 0)
  ) {
    // width or height or font size cannot be 0, or there are no lines after trimming
    return {
      lines: [],
      textAlign: 'center',
      textBaseline: 'middle',
      width: positioning.width,
      height: 0
    }
  }

  ctx.font = getTextStyle(baseTextFormat)

  const hairWidth = justify ? measureText({ text: HAIR }) : 0
  const wrappedLines: Word[][] = []

  // now further wrap every hard line to make sure it fits within the `boxWidth`, down to a
  //  MINIMUM of 1 Word per line
  for (const hardLine of hardLines) {
    let { splitPoint } = measureLine(hardLine)

    // if the line fits, we're done; else, we have to break it down further to fit
    //  as best as we can (i.e. MIN one word per line, no breaks within words, no
    //  leading/pending whitespace)
    if (splitPoint >= hardLine.length) {
      wrappedLines.push(hardLine)
    } else {
      // shallow clone because we're going to break this line down further to get the best fit
      let softLine = hardLine.concat()
      while (splitPoint < softLine.length) {
        // right-trim what we split off in case we split just after some whitespace
        const splitLine = trimLine(softLine.slice(0, splitPoint), 'right').trimmedLine
        wrappedLines.push(splitLine)

        // left-trim what remains in case we split just before some whitespace
        softLine = trimLine(softLine.slice(splitPoint), 'left').trimmedLine;
        ({ splitPoint } = measureLine(softLine))
      }

      // get the last bit of the `softLine`
      // NOTE: since we started by timming the entire line, and we just left-trimmed
      //  what remained of `softLine`, there should be no need to trim again
      wrappedLines.push(softLine)
    }
  }

  if (justify) {
    wrappedLines.forEach((wrappedLine, idx) => {
      const justifiedLine = justifyLine({
        line: wrappedLine,
        spaceWidth: hairWidth,
        spaceChar: HAIR,
        boxWidth,
      })

      // make sure any new Words used for justification get measured so we're able to
      //  position them later when we generate the render spec
      measureLine(justifiedLine, true)
      wrappedLines[idx] = justifiedLine
    })
  }

  const spec = generateSpec({
    wrappedLines,
    wordMap,
    positioning,
  })

  ctx.restore()
  return spec
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
