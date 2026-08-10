interface FontParts {
  fontStyle: string
  fontVariant: string
  fontWeight: string | number
  fontSize: number
  font: string
}

export function buildFont({
  fontStyle,
  fontVariant,
  fontWeight,
  fontSize,
  font,
}: FontParts): string {
  // Families containing spaces must be quoted in the CSS font shorthand;
  // skip families that are already quoted or are a comma-separated list.
  const family = font.includes(' ') && !/['",]/.test(font) ? `"${font}"` : font
  let out = ''
  if (fontStyle) out += fontStyle + ' '
  if (fontVariant) out += fontVariant + ' '
  if (fontWeight) out += fontWeight + ' '
  return out + fontSize + 'px ' + family
}
