import { isWhitespace } from "./is-whitespace"
import { Word } from "./models"

export interface JustifyLineProps {
  /** Assumed to have already been trimmed on both ends. */
  line: Word[]
  /** Width (px) of `spaceChar`.  */
  spaceWidth: number
  /**
   * Character used as a whitespace in justification. Will be injected in between Words in
   *  `line` in order to justify the text on the line within `lineWidth`.
   */
  spaceChar: string
  /** Width (px) of the box containing the text (i.e. max `line` width). */
  boxWidth: number
}

/**
 * Extracts the __visible__ (i.e. non-whitespace) words from a line.
 * @param line
 * @returns New array with only non-whitespace words.
 */
const extractWords = function(line: Word[]) {
  return line.filter((word) => !isWhitespace(word.text))
}

/**
 * Deep-clones a Word.
 * @param word
 * @returns Deep-cloned Word.
 */
const cloneWord = function(word: Word) {
  const clone = { ...word }
  if (word.format) {
    clone.format = { ...word.format }
  }
  return clone
}

/**
 * Joins Words together using another set of Words.
 * @param words Words to join.
 * @param joiner Words to use when joining `words`. These will be deep-cloned and inserted
 *  in between every word in `words`, similar to `Array.join(string)` where the `string`
 *  is inserted in between every element.
 * @returns New array of Words. Empty if `words` is empty. New array of one Word if `words`
 *  contains only one Word.
 */
const joinWords = function(words: Word[], joiner: Word[]) {
  if (words.length <= 1 || joiner.length < 1) {
    return [...words]
  }

  const phrase: Word[] = []
  words.forEach((word, wordIdx) => {
    phrase.push(word)
    if (wordIdx < words.length - 1) { // don't append after last `word`
      joiner.forEach((jw) => (phrase.push(cloneWord(jw))))
    }
  })

  return phrase
}

/**
 * Inserts spaces between words in a line in order to raise the line width to the box width.
 *  The spaces are evenly spread in the line, and extra spaces (if any) are only inserted
 *  between words, not at either end of the `line`.
 *
 * @returns New array containing original words from the `line` with additional whitespace
 *  for justification to `boxWidth`.
 */
export function justifyLine({
  line,
  spaceWidth,
  spaceChar,
  boxWidth,
}: JustifyLineProps) {
  const words = extractWords(line)
  if (words.length <= 1) {
    return line.concat()
  }

  const wordsWidth = words.reduce((width, word) => width + (word.metrics?.width ?? 0), 0)
  const noOfSpacesToInsert = (boxWidth - wordsWidth) / spaceWidth

  if (words.length > 2) {
    // use CEILING so we spread the partial spaces throughout except between the second-last
    //  and last word so that the spacing is more even and as tight as we can get it to
    //  the `boxWidth`
    const spacesPerWord = Math.ceil(noOfSpacesToInsert / (words.length - 1))
    const spaces: Word[] = Array.from({ length: spacesPerWord }, () => ({ text: spaceChar }))
    const firstWords = words.slice(0, words.length - 1) // all but last word
    const firstPart = joinWords(firstWords, spaces)
    const remainingSpaces = spaces.slice(
      0,
      Math.floor(noOfSpacesToInsert) - (firstWords.length - 1) * spaces.length
    )
    const lastWord = words[words.length - 1]
    return [...firstPart, ...remainingSpaces, lastWord]
  } else {
    // only 2 words so fill with spaces in between them: use FLOOR to make sure we don't
    //  go past `boxWidth`
    const spaces: Word[] = Array.from(
      { length: Math.floor(noOfSpacesToInsert) },
      () => ({ text: spaceChar })
    )
    return joinWords(words, spaces)
  }
}
