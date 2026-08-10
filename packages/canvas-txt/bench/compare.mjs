/**
 * Benchmark: canvas-txt v5 vs canvas-hypertxt vs canvas-txt v4.
 *
 * Mirrors the shape of canvas-hypertxt's README benchmark (N iterations of
 * splitting the same text) and adds a distinct-strings scenario, since
 * hypertxt keeps a global measurement cache that trivializes repeats.
 *
 * Run: node bench/compare.mjs
 */
import { createCanvas } from 'canvas'
import { splitText, layoutText } from '../dist/index.js'
import { split as hyperSplit, clearCache as hyperClearCache } from 'canvas-hypertxt'
import { splitText as splitTextV4 } from 'canvas-txt-v4'

const FONT = '16px Arial'
const WIDTH = 400
const ITERS = 5000

const WORDS =
  `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum`.split(
    ' '
  )

function makeText(chars, seed = 0) {
  let out = ''
  let i = seed
  while (out.length < chars) {
    out += (out ? ' ' : '') + WORDS[i % WORDS.length]
    i++
  }
  return out.slice(0, chars)
}

const ctx = createCanvas(800, 800).getContext('2d')
ctx.font = FONT

const contenders = {
  'v5 splitText': (text) => splitText({ ctx, text, width: WIDTH }),
  'v5 layoutText': (text) => layoutText(ctx, text, { width: WIDTH, fontSize: 16, font: 'Arial' }),
  'hypertxt': (text) => hyperSplit(ctx, text, FONT, WIDTH, false),
  'hypertxt hyper': (text) => hyperSplit(ctx, text, FONT, WIDTH, true),
  'v4 splitText': (text) => splitTextV4({ ctx, text, justify: false, width: WIDTH }),
}

function bench(fn, texts) {
  // fresh caches per contender so nobody rides another's warmup
  hyperClearCache()
  // warmup
  for (let i = 0; i < 100; i++) fn(texts[i % texts.length])
  const t0 = performance.now()
  for (let i = 0; i < ITERS; i++) fn(texts[i % texts.length])
  return performance.now() - t0
}

function run(scenarioName, makeTexts) {
  console.log(`\n## ${scenarioName} — ${ITERS} iterations, width ${WIDTH}px, ${FONT}`)
  for (const chars of [100, 600, 1000]) {
    const texts = makeTexts(chars)
    const rows = []
    for (const [name, fn] of Object.entries(contenders)) {
      const ms = bench(fn, texts)
      rows.push([name, ms])
    }
    const base = rows.find(([n]) => n === 'v5 splitText')[1]
    console.log(`\n${chars} chars:`)
    for (const [name, ms] of rows) {
      const rel = ms / base
      console.log(
        `  ${name.padEnd(16)} ${ms.toFixed(0).padStart(6)} ms total  ${(
          (ms / ITERS) * 1000
        )
          .toFixed(1)
          .padStart(7)} µs/op  ${rel.toFixed(2)}x`
      )
    }
  }
}

// Scenario A: identical text every iteration (the README's shape) —
// both libraries answer from their result memo
run('Scenario A: same text repeated', (chars) => [makeText(chars)])

// Scenario B: 500 distinct strings cycled 10x — result memos absorb the
// repeats, so this mixes each library's miss cost with its hit cost
run('Scenario B: 500 strings cycled', (chars) =>
  Array.from({ length: 500 }, (_, s) => `${s} ${makeText(chars, s)}`)
)

// Scenario C: a never-repeating string every iteration — result memos
// always miss; this isolates pure layout speed (vocabulary stays warm,
// as in real content)
run('Scenario C: never-repeating strings', (chars) =>
  Array.from({ length: ITERS }, (_, s) => `${s} ${makeText(chars, s)}`)
)

// Sanity: identical wrapping output? (informational)
const sample = makeText(600)
const v5 = splitText({ ctx, text: sample, width: WIDTH })
const hy = hyperSplit(ctx, sample, FONT, WIDTH, false)
console.log(`\nSanity — lines for same 600-char text: v5=${v5.length}, hypertxt=${hy.length}`)
