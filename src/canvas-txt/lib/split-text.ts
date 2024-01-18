import { getStyle } from './get-style'
import { isWhitespace } from './is-whitespace'
import { justifyLine } from './justify'
import { PositionedWord, SplitTextProps, SplitWordsProps, SplitWordsResults, Word } from './models'
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

export function splitWords({
  ctx,
  words,
  justify,
  width: boxWidth, // width of box inside canvas within which text is to be rendered (variable height)
  inferWhitespace = true,
}: SplitWordsProps): SplitWordsResults {
  // map of Word to measured width
  const wordMap = new Map<Word, number>()

  const measureText = (word: Word): number => {
    let textWidth = wordMap.get(word)
    if (textWidth !== undefined) {
      return textWidth
    }

    if (word.format) {
      ctx.save()
      ctx.font = getStyle(word.format)
    }

    textWidth = ctx.measureText(word.text).width
    wordMap.set(word, textWidth)

    if (word.format) {
      ctx.restore()
    }

    return textWidth
  }

  const measureLine = (words: Word[]): number =>
    words.reduce((lineWidth, word) => lineWidth + measureText(word), 0)

  const lines: Word[][] = []
  const initialLines = splitIntoLines(trimLine(words), inferWhitespace)

  const hairWidth = justify ? measureText({ text: HAIR }) : 0

  for (const singleLine of initialLines) {
    let lineWidth = measureLine(singleLine)

    // if the line fits, we're done; else, we have to break it down further to fit
    //  as best as we can (i.e. minimum one word per line, no breaks within words,
    //  no leading/pending whitespace)
    if (lineWidth <= boxWidth) {
      lines.push(singleLine)
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

      // Finally sets line to print
      lineToPrint = trimLine(tempLine.slice(0, splitPoint))

      lineToPrint = justify
        ? justifyLine({
            measureLine,
            line: lineToPrint,
            spaceWidth: hairWidth,
            spaceChar: HAIR,
            width: boxWidth,
          })
        : lineToPrint
      lines.push(lineToPrint)
      tempLine = trimLine(tempLine.slice(splitPoint))
      lineWidth = measureLine(tempLine)
    }

    if (lineWidth > 0) {
      lineToPrint = justify
        ? justifyLine({
            measureLine,
            line: tempLine,
            spaceWidth: hairWidth,
            spaceChar: HAIR,
            width: boxWidth,
          })
        : tempLine

      lines.push(lineToPrint)
    }
  }

  return {
    lines: lines.map((line): PositionedWord[] => {
      let nextX = 0
      return line.map((word): PositionedWord => {
        const wordWidth = wordMap.get(word) ?? 0
        const x = nextX
        nextX += wordWidth
        return { word, x, width: wordWidth }
      })
    })
  }
}

/**
 * Splits plain text into lines in the order in which they should be rendered, top-down,
 *  preserving whitespace __only within the text__ (whitespace on either end is trimmed).
 */
export function splitText({
  text,
  ...params
}: SplitTextProps): string[] {
  const textAsWords: Word[] = []

  // split the `text` into a series of Words, preserving whitespace
  let word: Word | undefined = undefined;
  let wasWhitespace = false
  Array.from(text.trim()).forEach((c) => {
    const charIsWhitespace = isWhitespace(c)
    if ((charIsWhitespace && !wasWhitespace) || (!charIsWhitespace && wasWhitespace)) {
      // save current `word`, if any, and start new `word`
      wasWhitespace = charIsWhitespace
      if (word) {
        textAsWords.push(word)
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
    textAsWords.push(word)
  }

  const results = splitWords({
    ...params,
    words: textAsWords,
  })

  return results.lines.map(
    (line) => line.map(({ word: { text } }) => text).join('')
  )
}
