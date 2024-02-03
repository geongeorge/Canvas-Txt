import { createCanvas } from 'canvas'
import { drawText, textToWords } from './canvas-txt/index'
// @ts-ignore
import * as fs from 'fs'

function main() {
  const canvas = createCanvas(400, 400)
  const ctx = canvas.getContext('2d')

  const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin convallis eros.'
  const words = textToWords(text)
  words.forEach((word) => {
    if (word.text === 'ipsum') {
      word.format = { fontStyle: 'italic', fontColor: 'red' }
    } else if (word.text === 'consectetur') {
      word.format = { fontWeight: '700', fontColor: 'blue' }
    }
  })

  // @ts-ignore
  const { height } = drawText(ctx, words, {
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    fontSize: 24,
    debug: true
  })

  // @ts-ignore
  // Convert the canvas to a buffer in PNG format
  const buffer = canvas.toBuffer('image/png')
  // @ts-ignore
  fs.writeFileSync('output.png', buffer)

  console.log(`Total height = ${height}`)
}

main()
