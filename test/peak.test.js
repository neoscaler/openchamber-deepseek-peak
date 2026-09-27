const test = require('node:test')
const assert = require('node:assert')
const {
  isPeak,
  isDeepSeekProvider,
  nextChange,
  formatRemaining,
} = require('../status/peak.js')

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

test('only the DeepSeek provider counts', () => {
  assert.equal(isDeepSeekProvider('deepseek/deepseek-flash'), true)
  assert.equal(isDeepSeekProvider('DeepSeek/deepseek-v4-pro'), true)
})

test('a DeepSeek model resold by another provider does not count', () => {
  assert.equal(isDeepSeekProvider('opencode/deepseek-v4-flash'), false)
  assert.equal(isDeepSeekProvider('opencode-go/deepseek-v4-pro'), false)
  assert.equal(isDeepSeekProvider('openrouter/deepseek/deepseek-chat'), false)
})

test('a model without a provider does not count', () => {
  assert.equal(isDeepSeekProvider('deepseek-flash'), false)
  assert.equal(isDeepSeekProvider('/deepseek-flash'), false)
  assert.equal(isDeepSeekProvider(null), false)
  assert.equal(isDeepSeekProvider(undefined), false)
})

test('counts down to the end of the current phase', () => {
  assert.equal(nextChange(at('2026-09-28T02:00:00Z')).toISOString(), '2026-09-28T04:00:00.000Z')
  assert.equal(nextChange(at('2026-09-28T05:00:00Z')).toISOString(), '2026-09-28T06:00:00.000Z')
  assert.equal(nextChange(at('2026-09-28T00:30:00Z')).toISOString(), '2026-09-28T01:00:00.000Z')
  assert.equal(nextChange(at('2026-09-28T11:00:00Z')).toISOString(), '2026-09-29T01:00:00.000Z')
})

test('counts across the weekend to Monday', () => {
  assert.equal(nextChange(at('2026-10-02T11:00:00Z')).toISOString(), '2026-10-05T01:00:00.000Z')
  assert.equal(nextChange(at('2026-09-27T03:00:00Z')).toISOString(), '2026-09-28T01:00:00.000Z')
})

test('formats the remaining time to ten seconds', () => {
  assert.equal(formatRemaining(1), '0:00:10')
  assert.equal(formatRemaining(90_000), '0:01:30')
  assert.equal(formatRemaining(2_700_000), '0:45:00')
  assert.equal(formatRemaining(3_599_999), '1:00:00')
  assert.equal(formatRemaining(7_290_000), '2:01:30')
  assert.equal(formatRemaining(223_200_000), '62:00:00')
  assert.equal(formatRemaining(0), '0:00:00')
  assert.equal(formatRemaining(-5_000), '0:00:00')
})
