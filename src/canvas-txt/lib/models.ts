export interface TextFormat {
  font?: string // family
  fontSize?: number // pixels only at this time
  fontWeight?: string
  fontStyle?: string

  // per spec, only CSS 2.1 values are supported
  // @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
  fontVariant?: 'normal' | 'small-caps' | ''

  // NOTE: line height is only supported at the context level (i.e. one line height for all
  //  the text) even though Canvas2DContext.font supports it; see `CanvasTextConfig.lineHeight`
}

export interface Word {
  /** The word. Can be whitespace also. */
  text: string

  /** Optional formatting. If unspecified, `CanvasTextConfig` defaults will be used. */
  format?: TextFormat
}

export type PlainText = string;

export type Text = PlainText | Word[];

export interface CanvasTextConfig extends TextFormat {
  width: number
  height: number
  x: number
  y: number
  debug?: boolean
  align?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'middle' | 'bottom'
  justify?: boolean

  /** Desired line height when rendering text. Defaults to height based on font styles. */
  lineHeight?: number
}

export interface SplitParams {
  ctx: CanvasRenderingContext2D
  justify: boolean
  width: number
}

export interface SplitTextProps extends SplitParams {
  /**
   * Text to render. Newlines are interpreted as hard breaks. Whitespace is preserved __only
   *  within the string__ (whitespace on either end is trimmed). Text will always wrap at max
   *  width regardless of newlines.
   */
  text: PlainText
}

export interface SplitWordsProps extends SplitParams {
  /** For hard breaks, include words that are newline characters as their `text`. */
  words: Word[]

  /**
   * True (default) indicates `words` contains _mostly_ visible words and whitespace should be
   *  inferred _unless a word is whitespace (e.g. a new line or tab)_, based on the context's
   *  general text formatting style (i.e. every space will use the font style set on the context).
   *
   * False indicates that `words` contains its own whitespace and it shouldn't be inferred.
   */
  inferWhitespace?: boolean
}

/**
 * A `Word` along with its position along the X axis within a "line", always starting from `0`
 *  relative to the line.
 *
 * It's the caller's responsibility to render each line at its desired line height within
 *  the Canvas, as well as to calculate each word's location in the Canvas' absolute space.
 *  Therefore the caller provides the position along the Y axis.
 */
export interface PositionedWord {
  word: Word
  x: number
  width: number
}

export interface SplitWordsResults {
  lines: PositionedWord[][]
}
