<script setup lang="ts">
import canvasTxt from 'canvas-txt';
import { ref, reactive, onMounted, watch } from 'vue';
import type { Ref } from 'vue'
import debounce from 'lodash/debounce'
import cloneDeep from 'lodash/cloneDeep'

const canvas: Ref<HTMLCanvasElement | null> = ref(null)
const context: Ref<CanvasRenderingContext2D | null> = ref(null)

const renderTime = ref(0)

const canvasSize = { w: 500, h: 500 }

const initialConfig = {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin convallis eros.',
      pos: { x: 100, y: 150 },
      size: { w: 300, h: 200 },
      font: {
        size: 38,
        lineHeight: null
      },
      debug: false,
      align: 'center',
      vAlign: 'middle',
      justify: false,
      min: 0,
      max: 800
    }

const config = reactive(cloneDeep(initialConfig))

function resetConfig() {
  for (const key of Object.keys(initialConfig)) {
    if (key in config) {
      config[key] = typeof initialConfig[key] === 'object' ? cloneDeep(initialConfig[key]) : initialConfig[key]
    }
  }
}

function initializeCanvas() {
  context.value = (canvas.value as HTMLCanvasElement).getContext('2d')

  deboundedRedrawAndMeasure()
}

function renderText() {
  

  if (!context.value) return

  const ctx = context.value

  ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)

  canvasTxt.font = "Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue'"
  canvasTxt.fontSize = 24
  canvasTxt.fontWeight = '100'
  // canvasTxt.fontStyle = 'oblique'
  // canvasTxt.fontVariant = 'small-caps'
  canvasTxt.debug = config.debug
  canvasTxt.align = config.align
  canvasTxt.vAlign = config.vAlign

  canvasTxt.justify = config.justify

  const { height } = canvasTxt.drawText(ctx, config.text, config.pos.x, config.pos.y, config.size.w, config.size.h)

  console.log(`Total height = ${height}`)
}

function redrawAndMeasure() {
  console.log("Rerendering")
  const t0 = performance.now();
  renderText()
  const t1 = performance.now();
  renderTime.value = t1 - t0
  console.log(`Rendering took ${renderTime.value} milliseconds.`);
}
const deboundedRedrawAndMeasure = debounce(redrawAndMeasure, 30)

watch(config, () => {
  deboundedRedrawAndMeasure()
})

onMounted(() => {
  initializeCanvas()
})
</script>

<template>
  <div>
    <div class="flex">
      <div class="canvas-wrapper">
        <canvas width="500" height="500" ref="canvas"></canvas>
      </div>
      <div class="controls-wrapper">
        <el-input
          v-model="config.text"
          :rows="2"
          type="textarea"
          placeholder="Please input"
        />
        <p>Canvas-txt uses the concept of textboxes borrowed from popular image editing softwares. 
          You draw a rectangular box then place the text in the box. Turn on the debug mode(below) to see what is happening.</p>
        <div class="slider">
          <span class="label">Pos X</span>
          <el-slider v-model="config.pos.x" show-input :min="0" :max="500" size="small" />
        </div>
        <div class="slider">
          <span class="label">Pos y</span>
          <el-slider v-model="config.pos.y" show-input :min="0" :max="500" size="small" />
        </div>
        <div class="slider">
          <span class="label">Width</span>
          <el-slider v-model="config.size.w" show-input :min="0" :max="500" size="small" />
        </div>
        <div class="slider">
          <span class="label">Height</span>
          <el-slider v-model="config.size.h" show-input :min="0" :max="500" size="small" />
        </div>
        <br />
        <el-row>
          <el-col :span="12">
            <el-form-item label="Horizontal Align">
              <el-select v-model="config.align" placeholder="Align">
                <el-option label="Center" value="center" />
                <el-option label="Left" value="left" />
                <el-option label="Right" value="right" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
           <el-form-item label="Vertical Align">
              <el-select v-model="config.vAlign" placeholder="vAlign">
                <el-option label="Middle" value="middle" />
                <el-option label="Top" value="top" />
                <el-option label="Bottom" value="bottom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <br />
        
        <el-row>
          <el-col :span="12">
            <el-checkbox v-model="config.justify" label="Justify Text" />
          </el-col>
          <el-col :span="12">
            <el-checkbox v-model="config.debug" label="Debug mode" />
          </el-col>
        </el-row>

        <br />
        <ElButton @click="resetConfig">Reset</ElButton>
      </div>
    </div>
    <div class="bottom-text">
      Last render took {{ renderTime }} milliseconds.
      <br>
      You will notice a delay after you change a control, this is because the render function is <a href="https://www.geeksforgeeks.org/debouncing-in-javascript/" target="_blank">debounced</a>.
    </div>
  </div>
</template>

<style scoped>

canvas {
  background-color: #E7E6E8;
  max-width: 100%;
}

.slider {
  display: flex;
  align-items: center;
}
.slider .el-slider {
  margin-top: 0;
  margin-left: 12px;
}
.slider .label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 44px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}
.slider .label + .el-slider {
  flex: 0 0 85%;
}


.flex {
  display: flex;
}

@media all and (max-width: 900px) { 
  .flex {
    flex-direction: column;
  }
}

.flex > div {
  flex: 1;
}

.canvas-wrapper {
  margin: 20px auto;
}

.controls-wrapper {
  margin: 20px auto;
  margin-left: 12px;
}

.bottom-text {
  font-size: 0.8em;
  color: #E7E6E8
}
</style>