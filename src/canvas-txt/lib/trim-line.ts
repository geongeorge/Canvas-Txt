import { isWhitespace } from "./is-whitespace";
import { Word } from "./models";

/**
 * Trims whitespace from the beginning and end of a `line`.
 * @param line
 * @param side Which side to trim.
 * @returns `trimmedLine` is a new array representing the trimmed line, even if nothing
 *  gets trimmed. Empty array if all whitespace. `trimmedLeft` is a new array containing
 *  what was trimmed from the left (empty if none). `trimmedRight` is a new array containing
 *  what was trimmed from the right (empty if none).
 */
export const trimLine = function(line: Word[], side: 'left' | 'right' | 'both' = 'both'): {
  trimmedLeft: Word[],
  trimmedRight: Word[],
  trimmedLine: Word[],
} {
  let leftTrim = 0;
  if (side === 'left' || side === 'both') {
    for (; leftTrim < line.length; leftTrim++) {
      if (!isWhitespace(line[leftTrim].text)) {
        break;
      }
    }

    if (leftTrim >= line.length) {
      // all whitespace
      return {
        trimmedLeft: line.concat(),
        trimmedRight: [],
        trimmedLine: [],
      }
    }
  }

  let rightTrim = line.length
  if (side === 'right' || side === 'both') {
    rightTrim--
    for (; rightTrim >= 0; rightTrim--) {
      if (!isWhitespace(line[rightTrim].text)) {
        break;
      }
    }
    rightTrim++ // back up one since we started one down for 0-based indexes

    if (rightTrim <= 0) {
      // all whitespace
      return {
        trimmedLeft: [],
        trimmedRight: line.concat(),
        trimmedLine: [],
      }
    }
  }

  return {
    trimmedLeft: line.slice(0, leftTrim),
    trimmedRight: line.slice(rightTrim),
    trimmedLine: line.slice(leftTrim, rightTrim),
  }
}
