<script setup lang="ts">
import { ElContainer, ElHeader, ElMain, ElFooter } from 'element-plus'
import AppCanvas from './AppCanvas.vue'

const year = new Date().getFullYear()
</script>

<template>
  <div class="common-layout">
    <ElContainer>
      <ElHeader class="container">
        <h1>Canvas-Txt: Text on HTML5 Canvas</h1>
        <p>
          A tiny, zero external dependancy library that makes it easier to
          render multiline text on HTML5 Canvas
        </p>
        <p>
          Read docs on
          <a href="https://github.com/geongeorge/Canvas-Txt/">Github</a>
        </p>
      </ElHeader>
      <ElMain class="container">
        <AppCanvas></AppCanvas>

        <br />
        <br />
      </ElMain>
      <ElFooter>
        <div class="footer-text">
          {{ year }} | <a href="https://geongeorge.com">Geon George</a>
        </div>
      </ElFooter>
    </ElContainer>
  </div>
</template>

<style scoped>
.container {
  margin: 40px auto;
  max-width: 1200px;
}

@media all and (max-width: 1200px) {
  .container {
    margin: 40px 40px;
  }
}
.footer-text {
  text-align: center;
  margin-top: 80px;
  margin-bottom: 40px;
}
</style>
