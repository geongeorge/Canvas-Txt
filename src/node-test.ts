import { createCanvas } from 'canvas'
import { drawText } from './canvas-txt/index'
// @ts-ignore
import * as fs from 'fs'

function main() {
  const canvas = createCanvas(400, 400)
  const ctx = canvas.getContext('2d')

  const txt = 'Hello World!'

  // @ts-ignore
  const { height } = drawText(ctx, txt, {
    x: 100,
    y: 200,
    width: 200,
    height: 200,
    fontSize: 24,
  })

  // @ts-ignore
  // Convert the canvas to a buffer in PNG format
  const buffer = canvas.toBuffer('image/png')
  // @ts-ignore
  fs.writeFileSync('output.png', buffer)

  console.log(`Total height = ${height}`)
}

main()
