// DEBUG import { createCanvas } from 'canvas'
import { drawText } from './canvas-txt/index'
// @ts-ignore
import * as fs from 'fs'

// DEBUG REMOVE once figure out how to include canvas@^2.11.2 in devDependencies
//  and have `yarn install` actually succeed past the node-gyp process that keeps
//  failing even after reinstalling XCode Command Line Tools
// @ts-ignore
const createCanvas = (x: number, y: number) => ({
  // @ts-ignore
  getContext(name: string) {}
})

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
