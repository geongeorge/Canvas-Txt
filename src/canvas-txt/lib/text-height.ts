interface Props {
  ctx: CanvasRenderingContext2D
  text: string
  style: string
}

export default function getTextHeight({ ctx, text, style }: Props) {
  const previousTextBaseline = ctx.textBaseline
  const previousFont = ctx.font

  ctx.textBaseline = 'bottom'
  ctx.font = style
  const { actualBoundingBoxAscent: height } = ctx.measureText(text)

  // Reset baseline
  ctx.textBaseline = previousTextBaseline
  ctx.font = previousFont

  return height
}
