interface Props {
  ctx: CanvasRenderingContext2D
  line: string
  spaceWidth: number
  spaceChar: string
  width: number
}

/**
 * This function will insert spaces between words in a line in order
 * to raise the line width to the box width.
 * The spaces are evenly spread in the line, and extra spaces (if any) are inserted
 * between the first words.
 *
 * It returns the justified text.
 */
export default function justifyLine({
  ctx,
  line,
  spaceWidth,
  spaceChar,
  width,
}: Props) {
  const text = line.trim()
  const words = text.split(/\s+/)
  const noOfWords = words.length - 1

  if (noOfWords === 0) return text

  // Width without spaces
  const lineWidth = ctx.measureText(words.join('')).width

  const noOfSpacesToInsert = (width - lineWidth) / spaceWidth
  const spacesPerWord = Math.floor(noOfSpacesToInsert / noOfWords)

  if (noOfSpacesToInsert < 1) return text

  console.log('noOfSpacesToInsert', noOfSpacesToInsert, noOfWords)

  const spaces = spaceChar.repeat(spacesPerWord)

  const justifiedText = words.join(spaces)

  return justifiedText
}
