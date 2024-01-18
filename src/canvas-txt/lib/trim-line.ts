import { isWhitespace } from "./is-whitespace";
import { Word } from "./models";

/**
 * Trims whitespace from the beginning and end of a `line`.
 * @param line
 * @returns New array representing the trimmed line. Empty array if all whitespace.
 */
export const trimLine = function(line: Word[]) {
  let leftTrim = 0;
  for (; leftTrim < line.length; leftTrim++) {
    if (!isWhitespace(line[leftTrim].text)) {
      break;
    }
  }

  let rightTrim = line.length - 1
  for (; rightTrim >= 0; rightTrim--) {
    if (!isWhitespace(line[rightTrim].text)) {
      break;
    }
  }
  rightTrim++ // so we include this Word which is NOT whitespace

  if (leftTrim < 0) {
    return line.slice(0, rightTrim)
  }

  if (leftTrim < rightTrim) {
    return line.slice(leftTrim, rightTrim)
  }

  return [] // all whitespace
}
