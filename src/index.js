// Hair space character for precise justification
const SPACE = '\u200a'

const canvasTxt = {
  debug: false,
  align: 'center',
  vAlign: 'middle',
  yLimit: null, // can be top or bottom, so thet text does not move beyond top or bottom irrespective of alignment
  fontSize: 14,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: 'Arial',
  lineHeight: null,
  justify: false,
  underline: false,
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} mytext
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  drawText: function(ctx, mytext, x, y, width, height) {
    // Parse all to integers
    ;[x, y, width, height] = [x, y, width, height].map(el => parseInt(el))

    if (width <= 0 || height <= 0 || this.fontSize <= 0) {
      //width or height or font size cannot be 0
      if (this.debug) console.warn('width or height or font size cannot be 0')
      return
    }

    // End points
    const xEnd = x + width
    const yEnd = y + height

    if (this.textSize) {
      console.error(
        '%cCanvas-Txt:',
        'font-weight: bold;',
        'textSize is depricated and has been renamed to fontSize'
      )
    }

    const { fontStyle, fontVariant, fontWeight, fontSize, font } = this
    const style = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${font}`
    ctx.font = style

    let textanchor

    if (this.align === 'right') {
      textanchor = xEnd
      ctx.textAlign = 'right'
    } else if (this.align === 'left') {
      textanchor = x
      ctx.textAlign = 'left'
    } else {
      textanchor = x + width / 2
      ctx.textAlign = 'center'
    }

    //added one-line only auto linebreak feature
    let textarray = []
    let temptextarray = mytext.split('\n')

    const spaceWidth = this.justify ? ctx.measureText(SPACE).width : 0

    temptextarray.forEach(txtt => {
      let textwidth = ctx.measureText(txtt.trim()).width
      if (textwidth <= width) {
        textarray.push({ text: txtt.trim(), width: textwidth })
      } else {
        let temptext = txtt
        let linelen = width
        let textlen
        let textpixlen
        let texttoprint
        while (textwidth > linelen) {
          textlen = 0
          textpixlen = 0
          texttoprint = ''
          while (textpixlen < linelen) {
            textlen++
            texttoprint = temptext.substr(0, textlen)
            textpixlen = ctx.measureText(texttoprint).width
          }
          // Remove last character that was out of the box
          textlen--
          if (textlen == 0) {
            // if width of a character is less then linelen
            if (this.debug)
              console.error('Width cannot be less than width of a character')
            return
          }
          texttoprint = texttoprint.substr(0, textlen)
          //if statement ensures a new line only happens at a space, and not amidst a word
          const backup = textlen
          if (temptext.substr(textlen, 1) != ' ') {
            while (temptext.substr(textlen, 1) != ' ' && textlen != 0) {
              textlen--
            }
            if (textlen == 0) {
              textlen = backup
            }
            texttoprint = temptext.substr(0, textlen).trim()
          }

          texttoprint = this.justify
            ? this.justifyLine(ctx, texttoprint, spaceWidth, SPACE, width)
            : texttoprint

          temptext = temptext.substr(textlen)
          textwidth = ctx.measureText(temptext).width
          textarray.push({
            text: texttoprint,
            width: ctx.measureText(texttoprint).width
          })
        }
        if (textwidth > 0) {
          textarray.push({ text: temptext, width: textwidth })
        }
      }
      // end foreach temptextarray
    })

    textarray = textarray.filter(txtline => txtline.text != ' ')

    const charHeight = this.lineHeight ? this.lineHeight : this.fontSize //close approximation of height with width
    const vheight = charHeight * (textarray.length - 1)
    const TEXT_HEIGHT = vheight + charHeight

    let txtY
    let debugY = y
    let computedVerticalAlignment

    if (TEXT_HEIGHT > height && this.yLimit) {
      if (this.yLimit == 'bottom') {
        computedVerticalAlignment = 'bottom'
      } else {
        computedVerticalAlignment = 'top'
      }
    } else {
      computedVerticalAlignment = this.vAlign
    }

    // Vertical Align
    if (computedVerticalAlignment === 'top') {
      txtY = y + this.fontSize
    } else if (computedVerticalAlignment === 'bottom') {
      txtY = yEnd - vheight
      debugY = yEnd
    } else {
      //defaults to center
      debugY = y + height / 2
      if (textarray.length % 2 == 0) {
        // even no. of lines
        txtY = y + height / 2 - (textarray.length / 2 - 1) * charHeight
      } else {
        // odd no. of lines
        txtY =
          y +
          height / 2 +
          parseInt(this.fontSize) / 2 -
          Math.floor(textarray.length / 2) * charHeight
      }
    }

    ctx.textBaseline = 'bottom'
    const offset = this.getBaseLineOffset(ctx, 'abbcdefgyABCDGI', style)
    ctx.lineWidth = '2'
    //print all lines of text
    ctx.beginPath()
    textarray.forEach(txtline => {
      ctx.fillText(txtline.text, textanchor, txtY)

      const underlineY = txtY - offset + 2
      if (this.underline) {
        if (this.align == 'left') {
          ctx.moveTo(textanchor, underlineY)
          ctx.lineTo(textanchor + txtline.width, underlineY)
        } else if (this.align == 'right') {
          ctx.moveTo(textanchor, underlineY)
          ctx.lineTo(textanchor - txtline.width, underlineY)
        } else if (this.align == 'center') {
          ctx.moveTo(textanchor - txtline.width / 2, underlineY)
          ctx.lineTo(textanchor + txtline.width / 2, underlineY)
        }
      }
      txtY += charHeight
    })
    ctx.stroke()

    if (this.debug) {
      // Text box
      ctx.lineWidth = 3
      ctx.strokeStyle = '#00909e'
      ctx.strokeRect(x, y, width, height)

      ctx.lineWidth = 2
      // Horizontal Center
      ctx.strokeStyle = '#f6d743'
      ctx.beginPath()
      ctx.moveTo(textanchor, y)
      ctx.lineTo(textanchor, yEnd)
      ctx.stroke()
      // Vertical Center
      ctx.strokeStyle = '#ff6363'
      ctx.beginPath()
      ctx.moveTo(x, debugY)
      ctx.lineTo(xEnd, debugY)
      ctx.stroke()
    }

    return { height: TEXT_HEIGHT }
  },
  // Calculate Height of the font
  getTextHeight: function(ctx, text, style) {
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

  getBaseLineOffset: function(ctx, text, style) {
    const previousTextBaseline = ctx.textBaseline
    const previousFont = ctx.font

    ctx.font = style
    ctx.textBaseline = 'alphabetic'
    const { fontBoundingBoxDescent: offset } = ctx.measureText(text)

    // Reset baseline
    ctx.textBaseline = previousTextBaseline
    ctx.font = previousFont
    return offset
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
  justifyLine: function(ctx, line, spaceWidth, spaceChar, width) {
    const text = line.trim()

    const lineWidth = ctx.measureText(text).width

    const nbSpaces = text.split(/\s+/).length - 1
    const nbSpacesToInsert = Math.floor((width - lineWidth) / spaceWidth)

    if (nbSpaces <= 0 || nbSpacesToInsert <= 0) return text

    // We insert at least nbSpacesMinimum and we add extraSpaces to the first words
    const nbSpacesMinimum = Math.floor(nbSpacesToInsert / nbSpaces)
    let extraSpaces = nbSpacesToInsert - nbSpaces * nbSpacesMinimum

    let spaces = []
    for (let i = 0; i < nbSpacesMinimum; i++) {
      spaces.push(spaceChar)
    }
    spaces = spaces.join('')

    const justifiedText = text.replace(/\s+/g, match => {
      const allSpaces = extraSpaces > 0 ? spaces + spaceChar : spaces
      extraSpaces--
      return match + allSpaces
    })

    return justifiedText
  }
}

export default canvasTxt
