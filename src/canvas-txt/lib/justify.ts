import { isWhitespace } from "./is-whitespace"
import { Word } from "./models"
import { trimLine } from "./trim-line"

export interface JustifyLineProps {
  measureLine: (words: Word[]) => number
  line: Word[]
  spaceWidth: number
  spaceChar: string
  width: number
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

// DEBUG TODO: This isn't the greatest "justify" algorithm because it's not able to take
//  the whole text into account and make smarter splits in order to spread words among lines
//  in a better way; all it sees is one line, and it relies on splitWords() to decide which
//  words go on which line, and splitWords() isn't taking justification into account. This
//  algorithm will justify the line, but not the text as a whole...
/**
 * This function will insert spaces between words in a line in order
 * to raise the line width to the box width.
 * The spaces are evenly spread in the line, and extra spaces (if any) are inserted
 * between the first words.
 *
 * It returns the justified text.
 */
export function justifyLine({
  measureLine,
  line,
  spaceWidth,
  spaceChar,
  width,
}: JustifyLineProps) {
  const trimmedLine = trimLine(line)
  const words = extractWords(trimmedLine)
  const numOfWords = words.length - 1

  if (numOfWords <= 0) return trimmedLine

  // Width without whitespace
  const lineWidth = measureLine(words)

  const noOfSpacesToInsert = (width - lineWidth) / spaceWidth
  const spacesPerWord = Math.floor(noOfSpacesToInsert / numOfWords)

  if (noOfSpacesToInsert < 1) return trimmedLine

  const spaces: Word[] = Array.from({ length: spacesPerWord }, () => ({ text: spaceChar }))

  return joinWords(words, spaces)
}
