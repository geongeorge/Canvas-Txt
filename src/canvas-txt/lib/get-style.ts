import { TextFormat } from "./models";

export const DEFAULT_FONT_FAMILY = 'Arial'
export const DEFAULT_FONT_SIZE = 14

/**
 * Generates a [CSS font](https://developer.mozilla.org/en-US/docs/Web/CSS/font) value.
 * @param format
 * @returns Style string to set on context's `font` property.
 */
export const getStyle = function({
  font,
  fontSize,
  fontStyle,
  fontVariant,
  fontWeight,
}: TextFormat) {
  // per spec:
  // - font-style, font-variant and font-weight must precede font-size
  // - font-family must be the last value specified
  // @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
  return `${fontStyle || ''} ${fontVariant || ''} ${
    fontWeight || ''
  } ${fontSize ?? DEFAULT_FONT_SIZE}px ${font || DEFAULT_FONT_FAMILY}`.trim()
}
