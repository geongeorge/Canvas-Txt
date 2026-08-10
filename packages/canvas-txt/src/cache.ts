/**
 * Module-level width caches, shared across calls and keyed by font (plus
 * letterSpacing/direction, which change glyph advances). This is what makes
 * steady-state wrapping cheap: each unique segment is shaped once per font,
 * afterwards line widths are computed by summing cached numbers.
 *
 * Call `clearMeasurementCache()` after loading web fonts — a font file
 * arriving changes the metrics behind already-cached widths.
 */

const MAX_SEGMENTS_PER_FONT = 10_000

const segmentCaches = new Map<string, Map<string, number>>()

interface CachedFontMetrics {
  ascent: number
  descent: number
  height: number
}

const metricsCache = new Map<string, CachedFontMetrics>()

export function getSegmentCache(cacheKey: string): Map<string, number> {
  let cache = segmentCaches.get(cacheKey)
  if (!cache) {
    cache = new Map()
    segmentCaches.set(cacheKey, cache)
  }
  return cache
}

/** FIFO-evicting insert so a pathological corpus can't grow unbounded. */
export function cacheSegmentWidth(
  cache: Map<string, number>,
  segment: string,
  width: number
): void {
  if (cache.size >= MAX_SEGMENTS_PER_FONT) {
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }
  cache.set(segment, width)
}

export function getCachedFontMetrics(
  cacheKey: string
): CachedFontMetrics | undefined {
  return metricsCache.get(cacheKey)
}

export function setCachedFontMetrics(
  cacheKey: string,
  metrics: CachedFontMetrics
): void {
  metricsCache.set(cacheKey, metrics)
}

const MAX_RESULTS = 500

const layoutResults = new Map<string, unknown>()
const splitResults = new Map<string, readonly string[]>()

function setWithEviction<V>(map: Map<string, V>, key: string, value: V): void {
  if (map.size >= MAX_RESULTS) {
    const oldest = map.keys().next()
    if (!oldest.done) map.delete(oldest.value)
  }
  map.set(key, value)
}

export function getCachedLayout(key: string): unknown {
  return layoutResults.get(key)
}

export function setCachedLayout(key: string, layout: unknown): void {
  setWithEviction(layoutResults, key, layout)
}

export function getCachedSplit(key: string): readonly string[] | undefined {
  return splitResults.get(key)
}

export function setCachedSplit(key: string, lines: readonly string[]): void {
  setWithEviction(splitResults, key, lines)
}

/**
 * Drop every cached measurement and memoized result. Call this after
 * `document.fonts` finishes loading (or any time a font file arrives) so
 * widths are re-measured with the real font instead of its fallback.
 */
export function clearMeasurementCache(): void {
  segmentCaches.clear()
  metricsCache.clear()
  layoutResults.clear()
  splitResults.clear()
}
