/**
 * The subset of TextMetrics canvas-txt reads. Structurally satisfied by the
 * DOM TextMetrics as well as node-canvas and skia-canvas metrics objects.
 */
export interface TextMetricsLike {
  width: number
  actualBoundingBoxAscent: number
  actualBoundingBoxDescent: number
  fontBoundingBoxAscent?: number
  fontBoundingBoxDescent?: number
}

/**
 * Minimal structural interface over a 2D context. Satisfied by
 * CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D, node-canvas
 * and skia-canvas contexts — no casts needed.
 */
export interface TextContext {
  font: string
  textAlign: 'center' | 'end' | 'left' | 'right' | 'start'
  textBaseline:
    | 'alphabetic'
    | 'bottom'
    | 'hanging'
    | 'ideographic'
    | 'middle'
    | 'top'
  fillText(text: string, x: number, y: number): void
  measureText(text: string): TextMetricsLike
  // Optional capabilities — used when present
  direction?: 'ltr' | 'rtl' | 'inherit'
  letterSpacing?: string
  fillStyle?: unknown
  strokeStyle?: unknown
  lineWidth?: number
  strokeText?(text: string, x: number, y: number): void
  strokeRect?(x: number, y: number, w: number, h: number): void
  beginPath?(): void
  moveTo?(x: number, y: number): void
  lineTo?(x: number, y: number): void
  stroke?(): void
  setLineDash?(segments: number[]): void
  globalAlpha?: number
}

export interface TextStyle {
  /** Font family, e.g. `'Arial'` or `"'Fira Sans', sans-serif"`. Default `'Arial'` */
  font?: string
  /** Font size in px. Default `14` */
  fontSize?: number
  /** Same as css font-weight, e.g. `'bold'`, `100` */
  fontWeight?: string | number
  /** Same as css font-style, e.g. `'italic'` */
  fontStyle?: string
  /** Same as css font-variant, e.g. `'small-caps'` */
  fontVariant?: string
  /** Line height in px. Defaults to the font's natural line height */
  lineHeight?: number
  /** Same as css letter-spacing, e.g. `'2px'`. Applied where the context supports it */
  letterSpacing?: string
  /** Text direction. Applied where the context supports it */
  direction?: 'ltr' | 'rtl' | 'inherit'
  /** Horizontal alignment inside the box. Default `'center'` */
  align?: 'left' | 'center' | 'right'
  /** Vertical alignment inside the box. Default `'middle'` */
  vAlign?: 'top' | 'middle' | 'bottom'
  /** Stretch soft-wrapped lines to the full box width. Default `false` */
  justify?: boolean
  /**
   * What happens to lines that don't fit the box height:
   * `'visible'` keeps them, `'hidden'` clips them, `'ellipsis'` clips and
   * appends `…` to the last visible line. Default `'visible'`
   */
  overflow?: 'visible' | 'hidden' | 'ellipsis'
  /** Hard cap on the number of lines, independent of box height */
  maxLines?: number
  /**
   * Reuse segment widths from a module-level per-font cache shared across
   * calls (fast; call `clearMeasurementCache()` after loading web fonts).
   * Set `false` to measure exactly per call with no shared state.
   * Default `true`
   */
  cache?: boolean
}

export interface LayoutConfig extends TextStyle {
  /** Width of the text box. Required */
  width: number
  /** Height of the text box — used by vAlign and overflow */
  height?: number
}

export interface DrawStyle {
  /** Fill style for the text. Defaults to the context's current fillStyle */
  fill?: string | object
  /** When set, the text is also stroked with this style */
  stroke?: string | object
  /** Line width used for the stroke. Default `1` */
  strokeWidth?: number
}

export interface DrawTextConfig extends LayoutConfig {
  x: number
  y: number
  height: number
  /** Draw the box and alignment guides */
  debug?: boolean
  style?: DrawStyle
}

export interface LayoutWord {
  text: string
  /** Left edge relative to the box's left edge */
  x: number
}

export interface LayoutLine {
  text: string
  /** Left edge relative to the box's left edge (alignment applied) */
  x: number
  /** Alphabetic-baseline y relative to the box's top edge */
  y: number
  width: number
  /** Word positions for justified lines; null when the line isn't justified */
  words: LayoutWord[] | null
}

export interface TextLayout {
  lines: LayoutLine[]
  /** Width of the widest line (box width for justified layouts) */
  width: number
  /** Total height of the laid-out text block */
  height: number
  lineHeight: number
  /** Resolved CSS font shorthand used for this layout */
  font: string
  letterSpacing?: string
  direction?: 'ltr' | 'rtl' | 'inherit'
  /** True when overflow/maxLines dropped content */
  clipped: boolean
}
