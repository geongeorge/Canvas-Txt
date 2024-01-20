export interface TextFormat {
  /** Font family (CSS value). */
  fontFamily?: string

  // DEBUG TODO: rendering words at different sizes doesn't render well per baseline
  /** Font size (px). */
  fontSize?: number

  /** Font weight (CSS value). */
  fontWeight?: string
  /** Font style (CSS value) */
  fontStyle?: string

  // per spec, only CSS 2.1 values are supported
  // @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
  /** Font variant (CSS value). */
  fontVariant?: 'normal' | 'small-caps' | ''

  // NOTE: line height is not currently supported
}

export interface Word {
  /** The word. Can also be whitespace. */
  text: string
  /** Optional formatting. If unspecified, base format defaults will be used. */
  format?: TextFormat
}

export type PlainText = string;

export type Text = PlainText | Word[];

export interface CanvasTextConfig extends TextFormat {
  /**
   * Width of box (px) at X/Y in 2D context within which text should be rendered. This will affect
   *  text wrapping, but will not necessarily constrain the text because, at minimum, one word,
   *  regardless of its width, will be rendered per line.
   */
  width: number
  /**
   * Height of box (px) at X/Y in 2D context within which text should be rendered. While this
   *  __will not constrain how the text is rendered__, it will determine how it's positioned
   *  given the alignment specified (`align` and `vAlign`). All the text is rendered, and may
   *  be rendered above/below the box defined in part by this dimension if it's too long to
   *  fit within the specified `boxWidth`.
   */
  height: number
  /** Absolute X coordinate (px) in 2D context where text should be rendered. */
  x: number
  /** Absolute Y coordinate (px) in 2D context where text should be rendered. */
  y: number

  /** True if debug lines should be rendered behind the text. */
  debug?: boolean

  /** Horizontal alignment. Defaults to 'center'. */
  align?: 'left' | 'center' | 'right'
  /** Vertical alignment. Defaults to 'middle'. */
  vAlign?: 'top' | 'middle' | 'bottom'
  /** True if text should be justified within the `boxWidth` to fill the hole width. */
  justify?: boolean

  /**
   * __NOTE:__ Applies only if `text`, given to `drawText()`, is a `Word[]`. Ignored if it's
   *  a `string`.
   *
   * True (default) indicates `text` is a `Word` array that contains _mostly_ visible words and
   *  whitespace should be inferred _unless a word is whitespace (e.g. a new line or tab)_, based
   *  on the context's general text formatting style (i.e. every space will use the font style set
   *  on the context). This makes it easier to provide a `Word[]` because whitespace can be omitted
   *  if it's just spaces, and only informative whitespace is necessary (e.g. hard line breaks
   *  as Words with `text="\n"`).
   *
   * False indicates that `words` contains its own whitespace and it shouldn't be inferred.
   */
  inferWhitespace?: boolean
}

export interface BaseSplitProps {
  ctx: CanvasRenderingContext2D

  /** Absolute X coordinate (px) in 2D context where text should be rendered. */
  x: number
  /** Absolute Y coordinate (px) in 2D context where text should be rendered. */
  y: number
  /**
   * Width of box (px) at X/Y in 2D context within which text should be rendered. This will affect
   *  text wrapping, but will not necessarily constrain the text because, at minimum, one word,
   *  regardless of its width, will be rendered per line.
   */
  width: number
  /**
   * Height of box (px) at X/Y in 2D context within which text should be rendered. While this
   *  __will not constrain how the text is rendered__, it will determine how it's positioned
   *  given the alignment specified (`align` and `vAlign`). All the text is rendered, and may
   *  be rendered above/below the box defined in part by this dimension if it's too long to
   *  fit within the specified `boxWidth`.
   */
  height: number

  /** Horizontal alignment. Defaults to 'center'. */
  align?: 'left' | 'center' | 'right'
  /** Vertical alignment. Defaults to 'middle'. */
  vAlign?: 'top' | 'middle' | 'bottom'
  /** True if text should be justified within the `boxWidth` to fill the hole width. */
  justify?: boolean

  /**
   * Base/default font styles. These will be used for any word that doesn't have specific
   *  formatting overrides. It's basically how "plain text" should be rendered.
   */
  format?: TextFormat
}

export interface SplitTextProps extends BaseSplitProps {
  /**
   * Text to render. Newlines are interpreted as hard breaks. Whitespace is preserved __only
   *  within the string__ (whitespace on either end is trimmed). Text will always wrap at max
   *  width regardless of newlines.
   */
  text: PlainText
}

export interface SplitWordsProps extends BaseSplitProps {
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
 * Maps a `Word` to its measured `metrics` and the font `format` used to measure it (if the
 *  `Word` specified a format to use; undefined means the base formatting, as set on the canvas
 *  2D context, was used).
 */
export type WordMap = Map<Word, { metrics: TextMetrics, format?: Required<TextFormat> }>

export interface PositionWordsProps {
  /** Words organized/wrapped into lines to be rendered. */
  wrappedLines: Word[][]

  /** Map of Word to measured dimensions (px) as it would be rendered. */
  wordMap: WordMap

  /**
   * Details on where to render the Words onto canvas. These parameters ultimately come
   *  from `SplitWordsProps`, and they come from `CanvasTextConfig`.
   */
  positioning: {
    width: SplitWordsProps['width']
    // NOTE: height does NOT constrain the text; used only for vertical alignment
    height: SplitWordsProps['height']
    x: SplitWordsProps['x']
    y: SplitWordsProps['y']
    align?: SplitWordsProps['align']
    vAlign?: SplitWordsProps['vAlign']
  }
}

/**
 * A `Word` along with its __relative__ position along the X/Y axis within the bounding box
 *  in which it is to be drawn.
 *
 * It's the caller's responsibility to render each Word onto the Canvas, as well as to calculate
 *  each Word's location in the Canvas' absolute space.
 */
export interface PositionedWord {
  /** Reference to a `Word` given to `splitWords()`. */
  word: Word

  /**
   * Full formatting used to measure/position the `word`, __if a `word.format` partial
   *  was specified.__
   *
   * ❗️ __Use this for actual rendering__ instead of the original `word.format`.
   */
  format?: Required<TextFormat>

  /** X position (px) relative to render box within 2D context. */
  x: number
  /** Y position (px) relative to render box within 2D context. */
  y: number
  /** Width (px) used to render text. */
  width: number
  /** Height (px) used to render text. */
  height: number

  /**
   * True if this `word` is non-visible whitespace (per a Regex `^\s+$` match) and so
   *  __could be skipped when rendering__.
   */
  isWhitespace: boolean
}

export interface SplitWordsResults {
  lines: PositionedWord[][]

  /**
   * Baseline to use when rendering text based on alignment settings.
   *
   * ❗️ Set this on the 2D context __before__ rendering the Words in the `lines`.
   */
  textBaseline: CanvasTextBaseline

  /**
   * Alignment to use when rendering text based on alignment settings.
   *
   * ❗️ Set this on the 2D context __before__ rendering the Words in the `lines`.
   */
  textAlign: CanvasTextAlign

  /** Total required height (px) to render all lines. */
  height: number
}

