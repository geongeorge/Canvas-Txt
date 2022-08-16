// Hair space character for precise justification
const SPACE = '\u200a'

const canvasTxt = {
  debug: false,
  align: 'center',
  vAlign: 'middle',
  fontSize: 14,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: 'Arial',
  lineHeight: null,
  justify: false,
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} myText
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  drawText: function (
    ctx: CanvasRenderingContext2D,
    myText: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (width <= 0 || height <= 0 || this.fontSize <= 0) {
      //width or height or font size cannot be 0
      return { height: 0 }
    }

    // End points
    const xEnd = x + width
    const yEnd = y + height

    const { fontStyle, fontVariant, fontWeight, fontSize, font } = this
    const style = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${font}`
    ctx.font = style

    let txtY = y + height / 2 + this.fontSize / 2

    let textAnchor: number

    if (this.align === 'right') {
      textAnchor = xEnd
      ctx.textAlign = 'right'
    } else if (this.align === 'left') {
      textAnchor = x
      ctx.textAlign = 'left'
    } else {
      textAnchor = x + width / 2
      ctx.textAlign = 'center'
    }

    //added one-line only auto linebreak feature
    let textArray: any[] = []
    let tempTextArray = myText.split('\n')

    const spaceWidth = this.justify ? ctx.measureText(SPACE).width : 0

    tempTextArray.forEach((singleLine) => {
      let textWidth = ctx.measureText(singleLine).width
      if (textWidth <= width) {
        textArray.push(singleLine)
      } else {
        let tempText = singleLine
        let lineLen = width
        let textLen
        let textPixLen
        let textToPrint
        textWidth = ctx.measureText(tempText).width
        while (textWidth > lineLen) {
          textLen = 0
          textPixLen = 0
          textToPrint = ''
          while (textPixLen < lineLen) {
            textLen++
            textToPrint = tempText.substr(0, textLen)
            textPixLen = ctx.measureText(tempText.substr(0, textLen)).width
          }
          // Remove last character that was out of the box
          textLen--
          textToPrint = textToPrint.substr(0, textLen)
          //if statement ensures a new line only happens at a space, and not amidst a word
          const backup = textLen
          if (tempText.substr(textLen, 1) != ' ') {
            while (tempText.substr(textLen, 1) != ' ' && textLen != 0) {
              textLen--
            }
            if (textLen == 0) {
              textLen = backup
            }
            textToPrint = tempText.substr(0, textLen)
          }

          textToPrint = this.justify
            ? this.justifyLine(ctx, textToPrint, spaceWidth, SPACE, width)
            : textToPrint

          tempText = tempText.substr(textLen)
          textWidth = ctx.measureText(tempText).width
          textArray.push(textToPrint)
        }
        if (textWidth > 0) {
          textArray.push(tempText)
        }
      }
      // end foreach tempTextArray
    })
    const charHeight = this.lineHeight
      ? this.lineHeight
      : this.getTextHeight(ctx, myText, style) //close approximation of height with width
    const vHeight = charHeight * (textArray.length - 1)
    const negOffset = vHeight / 2

    let debugY = y
    // Vertical Align
    if (this.vAlign === 'top') {
      ctx.textBaseline = 'top'
      txtY = y
    } else if (this.vAlign === 'bottom') {
      ctx.textBaseline = 'bottom'
      txtY = yEnd - vHeight
      debugY = yEnd
    } else {
      //defaults to center
      ctx.textBaseline = 'bottom'
      debugY = y + height / 2
      txtY -= negOffset
    }
    //print all lines of text
    textArray.forEach((txtline) => {
      txtline = txtline.trim()
      ctx.fillText(txtline, textAnchor, txtY)
      txtY += charHeight
    })

    if (this.debug) {
      // Text box
      ctx.lineWidth = 1
      ctx.strokeStyle = '#3120E0'
      ctx.strokeRect(x, y, width, height)

      ctx.lineWidth = 1
      // Horizontal Center
      ctx.strokeStyle = '#59CE8F'
      ctx.beginPath()
      ctx.moveTo(textAnchor, y)
      ctx.lineTo(textAnchor, yEnd)
      ctx.stroke()
      // Vertical Center
      ctx.strokeStyle = '#B9005B'
      ctx.beginPath()
      ctx.moveTo(x, debugY)
      ctx.lineTo(xEnd, debugY)
      ctx.stroke()
    }

    const TEXT_HEIGHT = vHeight + charHeight

    return { height: TEXT_HEIGHT }
  },
  // Calculate Height of the font
  getTextHeight: function (
    ctx: CanvasRenderingContext2D,
    text: string,
    style: string
  ) {
    const previousTextBaseline = ctx.textBaseline
    const previousFont = ctx.font

    ctx.textBaseline = 'bottom'
    ctx.font = style
    const { actualBoundingBoxAscent: height } = ctx.measureText(text)

    // Reset baseline
    ctx.textBaseline = previousTextBaseline
    ctx.font = previousFont

    return height
  },
  /**
   * This function will insert spaces between words in a line in order
   * to raise the line width to the box width.
   * The spaces are evenly spread in the line, and extra spaces (if any) are inserted
   * between the first words.
   *
   * It returns the justified text.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} line
   * @param {number} spaceWidth
   * @param {string} spaceChar
   * @param {number} width
   */
  justifyLine: function (
    ctx: CanvasRenderingContext2D,
    line: string,
    spaceWidth: number,
    spaceChar: string,
    width: number
  ) {
    const text = line.trim()

    const lineWidth = ctx.measureText(text).width

    const nbSpaces = text.split(/\s+/).length - 1
    const nbSpacesToInsert = Math.floor((width - lineWidth) / spaceWidth)

    if (nbSpaces <= 0 || nbSpacesToInsert <= 0) return text

    // We insert at least nbSpacesMinimum and we add extraSpaces to the first words
    const nbSpacesMinimum = Math.floor(nbSpacesToInsert / nbSpaces)
    let extraSpaces = nbSpacesToInsert - nbSpaces * nbSpacesMinimum

    let spaces: any[] | string = []
    for (let i = 0; i < nbSpacesMinimum; i++) {
      spaces.push(spaceChar)
    }
    spaces = spaces.join('')

    const justifiedText = text.replace(/\s+/g, (match) => {
      const allSpaces = extraSpaces > 0 ? spaces + spaceChar : spaces
      extraSpaces--
      return match + allSpaces
    })

    return justifiedText
  },
}

export default canvasTxt
