const test = require('node:test')
const assert = require('node:assert')
const { isPeak, state, isDeepSeek } = require('../status/peak.js')

const at = (iso) => new Date(iso)

test('peak inside both weekday windows', () => {
  assert.equal(isPeak(at('2026-09-28T01:00:00Z')), true)
  assert.equal(isPeak(at('2026-09-28T03:59:00Z')), true)
  assert.equal(isPeak(at('2026-09-28T06:00:00Z')), true)
  assert.equal(isPeak(at('2026-09-28T09:59:00Z')), true)
})

test('off-peak between, before and after the windows', () => {
  assert.equal(isPeak(at('2026-09-28T00:59:00Z')), false)
  assert.equal(isPeak(at('2026-09-28T04:00:00Z')), false)
  assert.equal(isPeak(at('2026-09-28T05:59:00Z')), false)
  assert.equal(isPeak(at('2026-09-28T10:00:00Z')), false)
  assert.equal(isPeak(at('2026-09-28T23:30:00Z')), false)
})

test('weekend is always off-peak', () => {
  assert.equal(isPeak(at('2026-09-26T02:00:00Z')), false)
  assert.equal(isPeak(at('2026-09-27T07:00:00Z')), false)
})

test('state carries the label and the flag', () => {
  assert.deepEqual(state(at('2026-09-28T02:00:00Z')), { label: 'PEAK', peak: true })
  assert.deepEqual(state(at('2026-09-26T02:00:00Z')), { label: 'OFF-PEAK', peak: false })
})

test('tracks DeepSeek models behind any provider', () => {
  assert.equal(isDeepSeek('deepseek/deepseek-flash'), true)
  assert.equal(isDeepSeek('opencode/deepseek-v4-flash'), true)
  assert.equal(isDeepSeek('opencode-go/deepseek-v4-pro'), true)
  assert.equal(isDeepSeek('DEEPSEEK/deepseek-flash'), true)
})

test('ignores other providers and missing models', () => {
  assert.equal(isDeepSeek('openai/gpt-5'), false)
  assert.equal(isDeepSeek('anthropic/claude-sonnet-4'), false)
  assert.equal(isDeepSeek('openrouter/moonshotai/kimi-k2'), false)
  assert.equal(isDeepSeek(null), false)
  assert.equal(isDeepSeek(undefined), false)
})
