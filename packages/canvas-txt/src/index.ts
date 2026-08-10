export { drawText, drawTextLayout } from './draw'
export type { DrawLayoutOptions } from './draw'
export { layoutText } from './layout'
export { clearMeasurementCache } from './cache'
export { measureText, splitText, getTextHeight } from './measure'
export type { MeasureTextConfig, SplitTextProps } from './measure'
export type {
  TextContext,
  TextMetricsLike,
  TextStyle,
  LayoutConfig,
  DrawTextConfig,
  DrawStyle,
  TextLayout,
  LayoutLine,
  LayoutWord,
} from './types'

// v4 name kept as an alias
export type { DrawTextConfig as CanvasTextConfig } from './types'
