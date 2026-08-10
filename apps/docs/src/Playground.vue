<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { layoutText, drawTextLayout, type TextLayout } from 'canvas-txt'

const SIZE = 560

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const defaults = {
  text: 'canvas-txt wraps, aligns and clips multiline text inside a box you define — a text layer for your canvas, no dependencies attached.',
  x: 110,
  y: 150,
  w: 340,
  h: 260,
  fontSize: 26,
  font: 'Arial',
  lineHeight: 0, // 0 = auto
  letterSpacing: 0,
  align: 'center' as 'left' | 'center' | 'right',
  vAlign: 'middle' as 'top' | 'middle' | 'bottom',
  justify: false,
  direction: 'ltr' as 'ltr' | 'rtl',
  overflow: 'visible' as 'visible' | 'hidden' | 'ellipsis',
  maxLines: 0, // 0 = none
  fill: '#17191c',
  strokeOn: false,
  stroke: '#0c8ce9',
  debug: true,
}

const state = reactive({ ...defaults })

function reset() {
  Object.assign(state, defaults)
}

const stats = reactive({ lines: 0, height: 0, clipped: false, ms: 0 })

function layoutConfig() {
  return {
    width: state.w,
    height: state.h,
    fontSize: state.fontSize,
    font: state.font,
    lineHeight: state.lineHeight > 0 ? state.lineHeight : undefined,
    letterSpacing:
      state.letterSpacing > 0 ? `${state.letterSpacing}px` : undefined,
    align: state.align,
    vAlign: state.vAlign,
    justify: state.justify,
    direction: state.direction === 'rtl' ? ('rtl' as const) : undefined,
    overflow: state.overflow,
    maxLines: state.maxLines > 0 ? state.maxLines : undefined,
  }
}

function drawGuides(c: CanvasRenderingContext2D) {
  const { x, y, w, h } = state
  c.save()
  c.strokeStyle = '#0c8ce9'
  c.lineWidth = 1

  // selection box
  c.strokeRect(x + 0.5, y + 0.5, w, h)

  // alignment guides
  c.setLineDash([4, 4])
  c.globalAlpha = 0.45
  const gx = state.align === 'left' ? x : state.align === 'right' ? x + w : x + w / 2
  const gy =
    state.vAlign === 'top' ? y : state.vAlign === 'bottom' ? y + h : y + h / 2
  c.beginPath()
  c.moveTo(gx + 0.5, y)
  c.lineTo(gx + 0.5, y + h)
  c.moveTo(x, gy + 0.5)
  c.lineTo(x + w, gy + 0.5)
  c.stroke()
  c.setLineDash([])
  c.globalAlpha = 1

  // corner handles, like a real selection
  c.fillStyle = '#fafaf7'
  for (const [hx, hy] of [
    [x, y],
    [x + w / 2, y],
    [x + w, y],
    [x, y + h / 2],
    [x + w, y + h / 2],
    [x, y + h],
    [x + w / 2, y + h],
    [x + w, y + h],
  ]) {
    c.fillRect(hx - 3, hy - 3, 6, 6)
    c.strokeRect(hx - 2.5, hy - 2.5, 5, 5)
  }
  c.restore()
}

let lastLayout: TextLayout | null = null

function render() {
  if (!ctx) return
  const c = ctx
  c.clearRect(0, 0, SIZE, SIZE)

  const t0 = performance.now()
  const layout = layoutText(c, state.text, layoutConfig())
  drawTextLayout(c, layout, {
    x: state.x,
    y: state.y,
    style: {
      fill: state.fill,
      stroke: state.strokeOn ? state.stroke : undefined,
    },
  })
  const t1 = performance.now()

  if (state.debug) drawGuides(c)

  lastLayout = layout
  stats.lines = layout.lines.length
  stats.height = Math.round(layout.height)
  stats.clipped = layout.clipped
  stats.ms = Math.max(0.01, Math.round((t1 - t0) * 100) / 100)
}

let raf = 0
function scheduleRender() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(render)
}

onMounted(() => {
  const el = canvasEl.value!
  const dpr = window.devicePixelRatio || 1
  el.width = SIZE * dpr
  el.height = SIZE * dpr
  ctx = el.getContext('2d')!
  ctx.scale(dpr, dpr)
  render()
})

watch(state, scheduleRender)

/* ------- generated code ------- */

const code = computed(() => {
  const opt: string[] = []
  opt.push(`  x: ${state.x}, y: ${state.y},`)
  opt.push(`  width: ${state.w}, height: ${state.h},`)
  opt.push(`  fontSize: ${state.fontSize},`)
  if (state.font !== 'Arial') opt.push(`  font: '${state.font}',`)
  if (state.lineHeight > 0) opt.push(`  lineHeight: ${state.lineHeight},`)
  if (state.letterSpacing > 0)
    opt.push(`  letterSpacing: '${state.letterSpacing}px',`)
  if (state.align !== 'center') opt.push(`  align: '${state.align}',`)
  if (state.vAlign !== 'middle') opt.push(`  vAlign: '${state.vAlign}',`)
  if (state.justify) opt.push(`  justify: true,`)
  if (state.direction === 'rtl') opt.push(`  direction: 'rtl',`)
  if (state.overflow !== 'visible') opt.push(`  overflow: '${state.overflow}',`)
  if (state.maxLines > 0) opt.push(`  maxLines: ${state.maxLines},`)
  if (state.strokeOn)
    opt.push(`  style: { fill: '${state.fill}', stroke: '${state.stroke}' },`)
  else if (state.fill !== defaults.fill)
    opt.push(`  style: { fill: '${state.fill}' },`)
  return [
    `import { drawText } from 'canvas-txt'`,
    ``,
    `drawText(ctx, text, {`,
    ...opt,
    `})`,
  ].join('\n')
})

const copiedCode = ref(false)
const copiedInstall = ref(false)

async function copy(text: string, flag: typeof copiedCode) {
  await navigator.clipboard.writeText(text)
  flag.value = true
  setTimeout(() => (flag.value = false), 1600)
}
</script>

<template>
  <section class="playground" aria-label="canvas-txt playground">
    <div class="stage">
      <div class="artboard">
        <canvas
          ref="canvasEl"
          :style="{ width: '100%', maxWidth: SIZE + 'px' }"
          aria-label="Live canvas preview"
        ></canvas>
      </div>
      <div class="statusbar" role="status">
        <span class="stat">
          <span class="stat-num">{{ stats.lines }}</span> lines
        </span>
        <span class="stat">
          <span class="stat-num">{{ stats.height }}</span> px used
        </span>
        <span class="stat clip" :class="{ on: stats.clipped }">
          {{ stats.clipped ? 'clipped' : 'fits' }}
        </span>
        <span class="stat time">
          layout {{ stats.ms }}<span class="unit">ms</span>
        </span>
      </div>
    </div>

    <aside class="inspector" aria-label="Inspector">
      <div class="group">
        <h3 class="group-title">Text</h3>
        <textarea
          v-model="state.text"
          rows="3"
          class="text-input"
          aria-label="Text to draw"
        ></textarea>
      </div>

      <div class="group">
        <h3 class="group-title">Box</h3>
        <label class="row" v-for="k in (['x', 'y', 'w', 'h'] as const)" :key="k">
          <span class="row-label">{{
            k === 'w' ? 'width' : k === 'h' ? 'height' : k
          }}</span>
          <input
            type="range"
            :min="0"
            :max="SIZE"
            v-model.number="state[k]"
          />
          <input
            type="number"
            class="num"
            :min="0"
            :max="SIZE"
            v-model.number="state[k]"
          />
        </label>
      </div>

      <div class="group">
        <h3 class="group-title">Type</h3>
        <label class="row">
          <span class="row-label">font</span>
          <select v-model="state.font" class="select">
            <option>Arial</option>
            <option>Georgia</option>
            <option>Times New Roman</option>
            <option>Courier New</option>
            <option>Verdana</option>
            <option>Trebuchet MS</option>
          </select>
        </label>
        <label class="row">
          <span class="row-label">fontSize</span>
          <input type="range" min="8" max="96" v-model.number="state.fontSize" />
          <input type="number" class="num" min="8" max="96" v-model.number="state.fontSize" />
        </label>
        <label class="row">
          <span class="row-label">lineHeight</span>
          <input type="range" min="0" max="140" v-model.number="state.lineHeight" />
          <input
            type="number"
            class="num"
            min="0"
            max="140"
            v-model.number="state.lineHeight"
            :placeholder="'auto'"
          />
        </label>
        <label class="row">
          <span class="row-label">letterSpacing</span>
          <input type="range" min="0" max="24" v-model.number="state.letterSpacing" />
          <input type="number" class="num" min="0" max="24" v-model.number="state.letterSpacing" />
        </label>
      </div>

      <div class="group">
        <h3 class="group-title">Layout</h3>
        <div class="row">
          <span class="row-label">align</span>
          <div class="seg" role="group" aria-label="Horizontal align">
            <button
              v-for="v in (['left', 'center', 'right'] as const)"
              :key="v"
              :aria-pressed="state.align === v"
              :class="{ on: state.align === v }"
              @click="state.align = v"
            >
              {{ v }}
            </button>
          </div>
        </div>
        <div class="row">
          <span class="row-label">vAlign</span>
          <div class="seg" role="group" aria-label="Vertical align">
            <button
              v-for="v in (['top', 'middle', 'bottom'] as const)"
              :key="v"
              :aria-pressed="state.vAlign === v"
              :class="{ on: state.vAlign === v }"
              @click="state.vAlign = v"
            >
              {{ v }}
            </button>
          </div>
        </div>
        <div class="row">
          <span class="row-label">direction</span>
          <div class="seg" role="group" aria-label="Direction">
            <button
              v-for="v in (['ltr', 'rtl'] as const)"
              :key="v"
              :aria-pressed="state.direction === v"
              :class="{ on: state.direction === v }"
              @click="state.direction = v"
            >
              {{ v }}
            </button>
          </div>
        </div>
        <label class="row check">
          <input type="checkbox" v-model="state.justify" />
          <span>justify soft-wrapped lines</span>
        </label>
      </div>

      <div class="group">
        <h3 class="group-title">Overflow</h3>
        <div class="row">
          <span class="row-label">overflow</span>
          <div class="seg" role="group" aria-label="Overflow">
            <button
              v-for="v in (['visible', 'hidden', 'ellipsis'] as const)"
              :key="v"
              :aria-pressed="state.overflow === v"
              :class="{ on: state.overflow === v }"
              @click="state.overflow = v"
            >
              {{ v }}
            </button>
          </div>
        </div>
        <label class="row">
          <span class="row-label">maxLines</span>
          <input type="range" min="0" max="12" v-model.number="state.maxLines" />
          <input type="number" class="num" min="0" max="12" v-model.number="state.maxLines" />
        </label>
      </div>

      <div class="group">
        <h3 class="group-title">Ink</h3>
        <label class="row">
          <span class="row-label">fill</span>
          <input type="color" v-model="state.fill" class="swatch" />
          <span class="mono-val">{{ state.fill }}</span>
        </label>
        <label class="row check">
          <input type="checkbox" v-model="state.strokeOn" />
          <span>stroke</span>
          <input
            v-if="state.strokeOn"
            type="color"
            v-model="state.stroke"
            class="swatch"
          />
        </label>
        <label class="row check">
          <input type="checkbox" v-model="state.debug" />
          <span>show box &amp; guides</span>
        </label>
      </div>

      <button class="reset" @click="reset">Reset playground</button>
    </aside>

    <div class="codestrip">
      <div class="install">
        <code>npm i canvas-txt</code>
        <button
          class="copy"
          @click="copy('npm i canvas-txt', copiedInstall)"
        >
          {{ copiedInstall ? 'copied' : 'copy' }}
        </button>
      </div>
      <div class="codeblock">
        <div class="codeblock-head">
          <span>Written by the inspector — paste it in your app</span>
          <button class="copy" @click="copy(code, copiedCode)">
            {{ copiedCode ? 'copied' : 'copy' }}
          </button>
        </div>
        <pre><code>{{ code }}</code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  grid-template-areas:
    'stage inspector'
    'code inspector';
  gap: 20px;
  align-items: start;
}

.stage {
  grid-area: stage;
  min-width: 0;
}

.artboard {
  background-color: var(--paper);
  background-image: radial-gradient(var(--paper-dot) 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: var(--radius);
  padding: 0;
  display: flex;
  justify-content: center;
  border: 1px solid var(--line);
}

canvas {
  display: block;
}

.statusbar {
  display: flex;
  gap: 22px;
  align-items: baseline;
  padding: 10px 4px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--ink-mid);
}

.stat-num {
  color: var(--ink-hi);
  font-weight: 600;
}

.clip {
  color: var(--ink-low);
}

.clip.on {
  color: var(--amber);
}

.time {
  margin-left: auto;
  color: var(--ink-low);
}

.unit {
  color: var(--ink-low);
}

/* inspector */
.inspector {
  grid-area: inspector;
  background: var(--chrome-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  padding: 6px 16px 16px;
  position: sticky;
  top: 16px;
}

.group {
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}

.group-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-low);
  margin-bottom: 10px;
}

.text-input {
  width: 100%;
  background: var(--chrome-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--ink-hi);
  font-family: var(--font-ui);
  font-size: 13.5px;
  padding: 8px 10px;
  resize: vertical;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
}

.row-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-mid);
  flex: 0 0 92px;
}

.row input[type='range'] {
  flex: 1;
  min-width: 0;
  appearance: none;
  -webkit-appearance: none;
  height: 3px;
  background: var(--chrome-3);
  border-radius: 2px;
}

.row input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ink-hi);
  border: none;
  cursor: pointer;
}

.row input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ink-hi);
  border: none;
  cursor: pointer;
}

.num {
  width: 56px;
  background: var(--chrome-2);
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--ink-hi);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 3px 6px;
  text-align: right;
}

.select {
  flex: 1;
  background: var(--chrome-2);
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--ink-hi);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 5px 6px;
}

.seg {
  display: flex;
  flex: 1;
  background: var(--chrome-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.seg button {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-mid);
  padding: 4px 0;
  border-radius: 4px;
}

.seg button:hover {
  color: var(--ink-hi);
}

.seg button.on {
  background: var(--accent-soft);
  color: var(--accent);
}

.check {
  gap: 8px;
  font-size: 13px;
  color: var(--ink-mid);
  cursor: pointer;
}

.check input {
  accent-color: var(--accent);
}

.swatch {
  width: 28px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: none;
  cursor: pointer;
}

.mono-val {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-low);
}

.reset {
  width: 100%;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--ink-mid);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px 0;
}

.reset:hover {
  color: var(--ink-hi);
  border-color: var(--ink-low);
}

/* code strip */
.codestrip {
  grid-area: code;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.install {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--chrome-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 13.5px;
}

.install code::before {
  content: '$ ';
  color: var(--ink-low);
}

.codeblock {
  background: var(--chrome-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  overflow: hidden;
}

.codeblock-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line-soft);
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.05em;
  color: var(--ink-low);
}

.codeblock pre {
  padding: 14px 16px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-hi);
}

.copy {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--accent);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 3px 10px;
}

.copy:hover {
  border-color: var(--accent);
}

@media (max-width: 900px) {
  .playground {
    grid-template-columns: 1fr;
    grid-template-areas:
      'stage'
      'inspector'
      'code';
  }
  .inspector {
    position: static;
  }
}
</style>
