import justifyLine from './justify'

// Hair space character for precise justification
const SPACE = '\u{200a}'

interface Props {
  ctx: CanvasRenderingContext2D
  text: string
  justify: boolean
  width: number
}

export default function splitText({
  ctx,
  text,
  justify,
  width,
}: Props): string[] {
  let textArray: string[] = []
  let initialTextArray = text.split('\n')

  const spaceWidth = justify ? ctx.measureText(SPACE).width : 0

  let index = 0
  let averageSplitPoint = 0
  for (const singleLine of initialTextArray) {
    let textWidth = ctx.measureText(singleLine).width
    const singleLineLength = singleLine.length

    if (textWidth <= width) {
      textArray.push(singleLine)
      continue
    }

    let tempLine = singleLine

    let splitPoint
    let splitPointWidth
    let textToPrint = ''

    while (textWidth > width) {
      index++
      splitPoint = averageSplitPoint
      splitPointWidth =
        splitPoint === 0
          ? 0
          : ctx.measureText(singleLine.substring(0, splitPoint)).width

      // if (splitPointWidth === width) Nailed
      if (splitPointWidth < width) {
        while (splitPointWidth < width && splitPoint < singleLineLength) {
          splitPoint++
          splitPointWidth = ctx.measureText(
            tempLine.substring(0, splitPoint)
          ).width
          if (splitPoint === singleLineLength) break
        }
      } else if (splitPointWidth > width) {
        while (splitPointWidth > width) {
          splitPoint = Math.max(1, splitPoint - 1)
          splitPointWidth = ctx.measureText(
            tempLine.substring(0, splitPoint)
          ).width
          if (splitPoint === 0 || splitPoint === 1) break
        }
      }

      averageSplitPoint = Math.round(
        averageSplitPoint + (splitPoint - averageSplitPoint) / index
      )

      // Remove last character that was out of the box
      splitPoint--

      // Ensures a new line only happens at a space, and not amidst a word
      if (splitPoint > 0) {
        let tempSplitPoint = splitPoint
        if (tempLine.substring(tempSplitPoint, tempSplitPoint + 1) != ' ') {
          while (
            tempLine.substring(tempSplitPoint, tempSplitPoint + 1) != ' ' &&
            tempSplitPoint >= 0
          ) {
            tempSplitPoint--
          }
          if (tempSplitPoint > 0) {
            splitPoint = tempSplitPoint
          }
        }
      }

      if (splitPoint === 0) {
        splitPoint = 1
      }

      // Finally sets text to print
      textToPrint = tempLine.substring(0, splitPoint)

      textToPrint = justify
        ? justifyLine({
            ctx,
            line: textToPrint,
            spaceWidth,
            spaceChar: SPACE,
            width,
          })
        : textToPrint
      textArray.push(textToPrint)
      tempLine = tempLine.substring(splitPoint)
      textWidth = ctx.measureText(tempLine).width
    }

    if (textWidth > 0) {
      textToPrint = justify
        ? justifyLine({
            ctx,
            line: tempLine,
            spaceWidth,
            spaceChar: SPACE,
            width,
          })
        : tempLine

      textArray.push(textToPrint)
    }
  }
  return textArray
}
