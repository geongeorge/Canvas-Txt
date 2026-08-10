<script setup lang="ts">
import Playground from './Playground.vue'
</script>

<template>
  <div class="page">
    <header class="titlebar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">canvas-txt</span>
        <span class="brand-ver">v5.0.0</span>
      </div>
      <nav class="titlebar-nav">
        <a href="https://github.com/geongeorge/Canvas-Txt">GitHub</a>
        <a href="https://www.npmjs.com/package/canvas-txt">npm</a>
        <a
          href="https://github.com/geongeorge/Canvas-Txt/blob/master/MIGRATION.md"
          >v4 → v5</a
        >
      </nav>
    </header>

    <main>
      <section class="hero">
        <p class="eyebrow">A zero-dependency canvas text engine</p>
        <h1 class="headline">
          Text <em>boxes</em> for HTML5&nbsp;canvas
        </h1>
        <p class="lede">
          Draw a box, hand it a string. canvas-txt wraps, aligns, clips and
          justifies multiline text — like a text layer in your design tool,
          rendered by one function call. Browsers, workers and Node.
        </p>
      </section>

      <Playground />

      <section class="notes">
        <div class="note">
          <h2>Layout once, paint forever</h2>
          <p>
            <code>layoutText()</code> returns positioned lines you can cache
            and repaint every frame with <code>drawTextLayout()</code> — no
            re-measuring in your render loop.
          </p>
        </div>
        <div class="note">
          <h2>Unicode-correct wrapping</h2>
          <p>
            Line breaks come from <code>Intl.Segmenter</code>: CJK, emoji and
            combining marks wrap at real boundaries, never mid-codepoint.
          </p>
        </div>
        <div class="note">
          <h2>Anywhere a 2D context exists</h2>
          <p>
            Typed against a minimal context interface —
            <code>OffscreenCanvas</code>, node-canvas and skia-canvas work
            without casts.
          </p>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>MIT © <a href="https://geongeorge.com">Geon George</a></span>
      <a href="https://github.com/geongeorge/Canvas-Txt/blob/master/MIGRATION.md"
        >Migrating from v4</a
      >
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-bottom: 1px solid var(--line-soft);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 14px;
}

.brand-mark {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--accent);
  align-self: center;
}

.brand-name {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand-ver {
  color: var(--ink-low);
  font-size: 12px;
}

.titlebar-nav {
  display: flex;
  gap: 22px;
  font-family: var(--font-mono);
  font-size: 13px;
}

.titlebar-nav a {
  color: var(--ink-mid);
  text-decoration: none;
}

.titlebar-nav a:hover {
  color: var(--ink-hi);
}

main {
  flex: 1;
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 0 28px;
}

.hero {
  padding: 64px 0 40px;
  max-width: 720px;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 18px;
}

.headline {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(40px, 6.5vw, 68px);
  line-height: 1.04;
  letter-spacing: -0.015em;
}

.headline em {
  font-style: italic;
  font-weight: 400;
  color: var(--amber);
}

.lede {
  margin-top: 22px;
  color: var(--ink-mid);
  font-size: 17px;
  max-width: 58ch;
}

.notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--line-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  overflow: hidden;
  margin: 56px 0 72px;
}

.note {
  background: var(--chrome-1);
  padding: 26px 24px;
}

.note h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 19px;
  margin-bottom: 10px;
}

.note p {
  color: var(--ink-mid);
  font-size: 14px;
}

.note code {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--ink-hi);
  background: var(--chrome-2);
  padding: 1px 5px;
  border-radius: 4px;
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 18px 28px;
  border-top: 1px solid var(--line-soft);
  color: var(--ink-low);
  font-size: 13px;
  font-family: var(--font-mono);
}

.footer a {
  color: var(--ink-mid);
}

@media (max-width: 900px) {
  .notes {
    grid-template-columns: 1fr;
  }
  .hero {
    padding-top: 44px;
  }
}
</style>
