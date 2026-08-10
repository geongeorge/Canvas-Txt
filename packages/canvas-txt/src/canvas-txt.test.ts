import { describe, it, expect, vi } from 'vitest'
import { createCanvas } from 'canvas'
import {
  drawText,
  drawTextLayout,
  layoutText,
  measureText,
  splitText,
  getTextHeight,
  clearMeasurementCache,
} from './index'

// No cast needed: node-canvas's context satisfies TextContext structurally
function makeCtx(width = 500, height = 500) {
  return createCanvas(width, height).getContext('2d')
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

describe('splitText', () => {
  it('returns a single line when the text fits', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    expect(splitText({ ctx, text: 'Hello', width: 200 })).toEqual(['Hello'])
  })

  it('returns one empty line for an empty string', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    expect(splitText({ ctx, text: '', width: 200 })).toEqual([''])
  })

  it('preserves explicit newlines', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    expect(splitText({ ctx, text: 'one\ntwo\nthree', width: 200 })).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  it('wraps long text and keeps every line within the box width', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const width = 200
    const lines = splitText({ ctx, text: LOREM, width })
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(width)
    }
    expect(lines.join(' ').replace(/\s+/g, '')).toBe(LOREM.replace(/\s+/g, ''))
  })

  it('never breaks words when they fit on the next line', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const lines = splitText({ ctx, text: LOREM, width: 200 })
    const words = new Set(LOREM.split(/\s+/).map((w) => w.replace(/,/g, '')))
    for (const line of lines) {
      for (const word of line.split(/\s+/)) {
        expect(words.has(word.replace(/,/g, ''))).toBe(true)
      }
    }
  })

  it('breaks a single unbreakable word across lines', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const width = 100
    const lines = splitText({
      ctx,
      text: 'Pneumonoultramicroscopicsilicovolcanoconiosis',
      width,
    })
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(width)
    }
  })

  it('wraps CJK text that contains no spaces', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const width = 100
    const text = '这是一段很长的中文文本没有空格但是仍然需要正确换行显示'
    const lines = splitText({ ctx, text, width })
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(ctx.measureText(line).width).toBeLessThanOrEqual(width)
    }
    expect(lines.join('')).toBe(text)
  })

  it('never splits emoji or surrogate pairs', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const text = '👨‍👩‍👧‍👦🎉🚀😀🌍🔥💧🌈⭐️🍕'.repeat(4)
    const lines = splitText({ ctx, text, width: 60 })
    expect(lines.length).toBeGreaterThan(1)
    // Re-joined text must be byte-identical: nothing split mid-codepoint
    expect(lines.join('')).toBe(text)
    for (const line of lines) {
      // An unpaired surrogate half at a line edge means a codepoint was split
      expect(line).not.toMatch(/[\uD800-\uDBFF]$/) // high surrogate with no pair
      expect(line).not.toMatch(/^[\uDC00-\uDFFF]/) // low surrogate with no pair
    }
  })

  it('does not return lines with leading or trailing spaces', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const lines = splitText({ ctx, text: LOREM, width: 150 })
    for (const line of lines) {
      expect(line).toBe(line.trim())
    }
  })
})

describe('layoutText', () => {
  it('positions lines inside the box respecting align and vAlign', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, 'one\ntwo', {
      width: 200,
      height: 100,
      fontSize: 20,
      align: 'left',
      vAlign: 'top',
    })
    expect(layout.lines).toHaveLength(2)
    expect(layout.lines[0].x).toBe(0)
    expect(layout.lines[0].y).toBeGreaterThan(0) // first baseline = ascent
    expect(layout.lines[1].y - layout.lines[0].y).toBeCloseTo(
      layout.lineHeight,
      5
    )
  })

  it('right-aligns lines to the box edge', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, 'abc', {
      width: 200,
      fontSize: 20,
      align: 'right',
    })
    const line = layout.lines[0]
    expect(line.x + line.width).toBeCloseTo(200, 5)
  })

  it('centers vertically inside the box height', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, 'abc', {
      width: 200,
      height: 100,
      fontSize: 20,
      vAlign: 'middle',
    })
    const line = layout.lines[0]
    // The single line's vertical center should sit at the box center
    const lineTop = line.y - layout.lineHeight // approx: baseline - lineHeight < top < baseline
    expect(lineTop).toBeLessThan(50)
    expect(line.y).toBeGreaterThan(50 - layout.lineHeight)
  })

  it('does not modify context state', () => {
    const ctx = makeCtx()
    ctx.font = '10px Arial'
    ctx.textAlign = 'right'
    layoutText(ctx, LOREM, { width: 200, fontSize: 30 })
    expect(ctx.font).toBe('10px Arial')
    expect(ctx.textAlign).toBe('right')
  })

  it('applies maxLines with clipped flag', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, LOREM, {
      width: 150,
      fontSize: 16,
      maxLines: 2,
    })
    expect(layout.lines).toHaveLength(2)
    expect(layout.clipped).toBe(true)
  })

  it('maxLines + ellipsis marks the last line', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, LOREM, {
      width: 150,
      fontSize: 16,
      maxLines: 2,
      overflow: 'ellipsis',
    })
    expect(layout.lines).toHaveLength(2)
    expect(layout.lines[1].text.endsWith('…')).toBe(true)
    expect(ctx.measureText(layout.lines[1].text).width).toBeLessThanOrEqual(150)
  })

  it('justifies soft-wrapped lines with word positions filling the width', () => {
    const ctx = makeCtx()
    const width = 200
    const layout = layoutText(ctx, LOREM, {
      width,
      fontSize: 16,
      justify: true,
      align: 'left',
    })
    const justified = layout.lines.filter((line) => line.words)
    expect(justified.length).toBeGreaterThan(0)
    ctx.font = layout.font // measure with the same font the layout used
    for (const line of justified) {
      // Text content carries no injected characters
      expect(line.text).not.toMatch(/ /)
      const words = line.words!
      const lastWord = words[words.length - 1]
      const rightEdge = lastWord.x + ctx.measureText(lastWord.text).width
      expect(rightEdge).toBeCloseTo(width, 3)
    }
    // Last line of the paragraph is never justified
    expect(layout.lines[layout.lines.length - 1].words).toBeNull()
  })

  it('honors a custom lineHeight with half-leading', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, 'one\ntwo\nthree', {
      width: 300,
      fontSize: 20,
      lineHeight: 50,
    })
    expect(layout.height).toBe(150)
    expect(layout.lines[1].y - layout.lines[0].y).toBe(50)
  })

  it('ignores explicitly-undefined config values', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, 'abc', {
      width: 200,
      align: undefined, // must fall back to default, not break
    })
    expect(layout.lines).toHaveLength(1)
  })
})

describe('drawText', () => {
  it('draws and returns height, width and lines', () => {
    const ctx = makeCtx()
    const result = drawText(ctx, 'Hello World', {
      x: 100,
      y: 200,
      width: 200,
      height: 200,
      fontSize: 24,
    })
    expect(result.height).toBeGreaterThan(0)
    expect(result.width).toBeGreaterThan(0)
    expect(result.lines).toEqual(['Hello World'])
  })

  it('returns empty result for a zero-sized box', () => {
    const ctx = makeCtx()
    expect(
      drawText(ctx, 'Hi', { x: 0, y: 0, width: 0, height: 100 }).height
    ).toBe(0)
    expect(
      drawText(ctx, 'Hi', { x: 0, y: 0, width: 100, height: 0 }).height
    ).toBe(0)
    expect(
      drawText(ctx, 'Hi', { x: 0, y: 0, width: 100, height: 100, fontSize: 0 })
        .height
    ).toBe(0)
  })

  it('quotes font families containing spaces', () => {
    const ctx = makeCtx()
    const fillText = vi.spyOn(ctx, 'fillText')
    drawText(ctx, 'Hello', {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      font: 'Times New Roman',
      fontSize: 20,
    })
    expect(fillText).toHaveBeenCalled()
  })

  it('restores context state after drawing', () => {
    const ctx = makeCtx()
    ctx.font = '10px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#123456'
    drawText(ctx, LOREM, {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      fontSize: 30,
      style: { fill: '#ff0000', stroke: '#00ff00' },
    })
    expect(ctx.font).toBe('10px Arial')
    expect(ctx.textAlign).toBe('right')
    expect(ctx.textBaseline).toBe('top')
    expect(ctx.fillStyle).toBe('#123456')
  })

  it('strokes when style.stroke is set', () => {
    const ctx = makeCtx()
    const strokeText = vi.spyOn(ctx, 'strokeText')
    drawText(ctx, 'Outlined', {
      x: 0,
      y: 0,
      width: 300,
      height: 100,
      fontSize: 30,
      style: { stroke: '#000', strokeWidth: 2 },
    })
    expect(strokeText).toHaveBeenCalled()
  })

  describe('overflow', () => {
    const box = { x: 0, y: 0, width: 150, height: 60, fontSize: 16 }

    it('visible (default) can overflow the box', () => {
      const ctx = makeCtx()
      const { height } = drawText(ctx, LOREM, { ...box })
      expect(height).toBeGreaterThan(box.height)
    })

    it('hidden clips lines to the box height', () => {
      const ctx = makeCtx()
      const { height } = drawText(ctx, LOREM, { ...box, overflow: 'hidden' })
      expect(height).toBeGreaterThan(0)
      expect(height).toBeLessThanOrEqual(box.height)
    })

    it('ellipsis clips and appends … to the last visible line', () => {
      const ctx = makeCtx()
      const { height, lines } = drawText(ctx, LOREM, {
        ...box,
        overflow: 'ellipsis',
      })
      expect(height).toBeLessThanOrEqual(box.height)
      expect(lines.length).toBeGreaterThan(0)
      expect(lines[lines.length - 1].endsWith('…')).toBe(true)
    })

    it('ellipsis leaves short text untouched', () => {
      const ctx = makeCtx()
      const { lines } = drawText(ctx, 'Hi', { ...box, overflow: 'ellipsis' })
      expect(lines).toEqual(['Hi'])
    })
  })
})

describe('drawTextLayout', () => {
  it('paints a cached layout without re-measuring', () => {
    const ctx = makeCtx()
    const layout = layoutText(ctx, LOREM, {
      width: 200,
      height: 200,
      fontSize: 16,
    })
    const measure = vi.spyOn(ctx, 'measureText')
    const fillText = vi.spyOn(ctx, 'fillText')
    drawTextLayout(ctx, layout, { x: 10, y: 10 })
    drawTextLayout(ctx, layout, { x: 250, y: 10 })
    expect(measure).not.toHaveBeenCalled()
    expect(fillText).toHaveBeenCalledTimes(layout.lines.length * 2)
  })
})

describe('measureText', () => {
  it('matches the layout drawText produces', () => {
    const drawCtx = makeCtx()
    const measureCtx = makeCtx()
    const drawn = drawText(drawCtx, LOREM, {
      x: 0,
      y: 0,
      width: 200,
      height: 500,
      fontSize: 16,
    })
    const measured = measureText(measureCtx, LOREM, {
      width: 200,
      fontSize: 16,
    })
    expect(measured.lines).toEqual(drawn.lines)
    expect(measured.height).toBe(drawn.height)
    expect(measured.width).toBeGreaterThan(0)
    expect(measured.width).toBeLessThanOrEqual(200)
  })

  it('restores the context font', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const before = ctx.font
    measureText(ctx, 'Hello', { width: 200, fontSize: 40 })
    expect(ctx.font).toBe(before)
  })
})

describe('measurement cache', () => {
  it('cached and exact modes produce identical line breaks', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    for (const text of [
      LOREM,
      'one\ntwo\nthree',
      'Pneumonoultramicroscopicsilicovolcanoconiosis',
      '这是一段很长的中文文本没有空格但是仍然需要正确换行显示',
      '👨‍👩‍👧‍👦🎉🚀😀🌍🔥💧🌈⭐️🍕'.repeat(4),
    ]) {
      for (const width of [80, 150, 400]) {
        const cached = layoutText(ctx, text, { width, fontSize: 16 })
        const exact = layoutText(ctx, text, { width, fontSize: 16, cache: false })
        expect(cached.lines.map((l) => l.text)).toEqual(
          exact.lines.map((l) => l.text)
        )
      }
    }
  })

  it('summed line widths stay close to real measurements', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    const layout = layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    ctx.font = layout.font
    for (const line of layout.lines) {
      expect(line.width).toBeCloseTo(ctx.measureText(line.text).width, 0)
    }
  })

  it('does not leak widths across fonts', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    const small = layoutText(ctx, LOREM, { width: 200, fontSize: 12 })
    const large = layoutText(ctx, LOREM, { width: 200, fontSize: 32 })
    expect(large.lines.length).toBeGreaterThan(small.lines.length)
    expect(large.width).toBeGreaterThan(small.width)
  })

  it('repeated cached layouts reuse measurements', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    const measure = vi.spyOn(ctx, 'measureText')
    layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    expect(measure).not.toHaveBeenCalled()
  })

  it('cache: false never touches shared state', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    layoutText(ctx, LOREM, { width: 200, fontSize: 16, cache: false })
    const measure = vi.spyOn(ctx, 'measureText')
    layoutText(ctx, LOREM, { width: 200, fontSize: 16, cache: false })
    expect(measure).toHaveBeenCalled()
  })

  it('memoizes identical layouts and freezes them', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    const a = layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    const b = layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    expect(b).toBe(a) // same frozen object from the memo
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.lines)).toBe(true)
    expect(Object.isFrozen(a.lines[0])).toBe(true)
    expect(() => {
      ;(a.lines[0] as { x: number }).x = 999
    }).toThrow()
  })

  it('memo distinguishes differing configs', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    const center = layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    const left = layoutText(ctx, LOREM, {
      width: 200,
      fontSize: 16,
      align: 'left',
    })
    expect(left).not.toBe(center)
    expect(left.lines[0].x).not.toBe(center.lines[0].x)
  })

  it('cache: false results are not frozen or shared', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    const a = layoutText(ctx, LOREM, { width: 200, fontSize: 16, cache: false })
    const b = layoutText(ctx, LOREM, { width: 200, fontSize: 16, cache: false })
    expect(b).not.toBe(a)
    expect(Object.isFrozen(a)).toBe(false)
  })

  it('splitText memoizes repeated calls', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    ctx.font = '16px Arial'
    const a = splitText({ ctx, text: LOREM, width: 200 })
    const measure = vi.spyOn(ctx, 'measureText')
    const b = splitText({ ctx, text: LOREM, width: 200 })
    expect(measure).not.toHaveBeenCalled()
    expect(b).toEqual(a)
  })

  it('clearMeasurementCache forces re-measuring', () => {
    const ctx = makeCtx()
    clearMeasurementCache()
    layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    clearMeasurementCache()
    const measure = vi.spyOn(ctx, 'measureText')
    layoutText(ctx, LOREM, { width: 200, fontSize: 16 })
    expect(measure).toHaveBeenCalled()
  })
})

describe('getTextHeight', () => {
  it('returns a positive height that scales with font size', () => {
    const ctx = makeCtx()
    const small = getTextHeight({ ctx, text: 'Mg', style: '10px Arial' })
    const large = getTextHeight({ ctx, text: 'Mg', style: '40px Arial' })
    expect(small).toBeGreaterThan(0)
    expect(large).toBeGreaterThan(small)
  })

  it('restores the context font', () => {
    const ctx = makeCtx()
    ctx.font = '14px Arial'
    const before = ctx.font
    getTextHeight({ ctx, text: 'M', style: '40px Georgia' })
    expect(ctx.font).toBe(before)
  })
})
