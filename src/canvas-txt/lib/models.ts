export type CanvasRenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

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
  /**
   * Optional metrics for this Word if it has __already been measured__ on canvas.
   *
   * ❗️ This is an optimization to increase performance of subsequent splitting of words.
   *  If specified, it's assumed that the `text` and `format` __have not changed__ since
   *  the last time the word was measured. Also that other aspects of the canvas related
   *  to rendering, such as aspect ratio, that could affect measurements __have not changed__.
   *
   * If not specified, this member __will be added__ by `splitWords()` once the word is measured
   *  so that it's easy to feed the same word back into `splitWords()` at a later time if its
   *  `text` and `format` remain the same. If they change, simply set this property to `undefined`
   *  to force it to be re-measured.
   */
  metrics?: CanvasTextMetrics // NOTE: all property are flagged as `readonly` (good!)
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
  ctx: CanvasRenderContext

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

/** Hash representing a `Word` and its associated `TextFormat`. */
export type WordHash = string;

/**
 * Identifies the minimum Canvas `TextMetrics` properties required by Canvas-Txt. This is
 *  important for serialization across the main thread to a Web Worker thread (or vice versa)
 *  as the native `TextMetrics` object fails to get serialized by `Worker.postMessage()`,
 *  causing an exception.
 */
export interface TextMetricsLike {
  fontBoundingBoxAscent: number
  fontBoundingBoxDescent: number
  width: number
}

export type CanvasTextMetrics = TextMetrics | TextMetricsLike

/**
 * Maps a `Word` to its measured `metrics` and the font `format` used to measure it (if the
 *  `Word` specified a format to use; undefined means the base formatting, as set on the canvas
 *  2D context, was used).
 */
export type WordMap = Map<WordHash, { metrics: CanvasTextMetrics, format?: Required<TextFormat> }>

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
  readonly word: Word

  /**
   * Full formatting used to measure/position the `word`, __if a `word.format` partial
   *  was specified.__
   *
   * ❗️ __Use this for actual rendering__ instead of the original `word.format`.
   */
  readonly format?: Readonly<Required<TextFormat>>

  /** X position (px) relative to render box within 2D context. */
  readonly x: number
  /** Y position (px) relative to render box within 2D context. */
  readonly y: number
  /** Width (px) used to render text. */
  readonly width: number
  /** Height (px) used to render text. */
  readonly height: number

  /**
   * True if this `word` is non-visible whitespace (per a Regex `^\s+$` match) and so
   *  __could be skipped when rendering__.
   */
  readonly isWhitespace: boolean
}

export interface RenderSpec {
  /**
   * Words split into lines as they would be visually wrapped on canvas if rendered
   *  to their prescribed positions.
   */
  readonly lines: PositionedWord[][]

  /**
   * Baseline to use when rendering text based on alignment settings.
   *
   * ❗️ Set this on the 2D context __before__ rendering the Words in the `lines`.
   */
  readonly textBaseline: CanvasTextBaseline

  /**
   * Alignment to use when rendering text based on alignment settings.
   *
   * ❗️ Set this on the 2D context __before__ rendering the Words in the `lines`.
   */
  readonly textAlign: CanvasTextAlign

  /**
   * Total required width (px) to render all the lines as wrapped (i.e. the original
   *  `width` used to split the words.
   */
  readonly width: number

  /** Total required height (px) to render all lines. */
  readonly height: number
}

