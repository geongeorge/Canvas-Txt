<script setup lang="ts">
import canvasTxt from 'canvas-txt';

console.log(canvasTxt)

const msg = 'Hello!'

// functions
function log() {
  console.log(msg)
}

</script>

<template>
  <div>
    <h1>Hello 2234. How are you</h1>
    <p>Hi</p>
    <button @click="log">{{ msg }}</button>
  </div>
</template>
