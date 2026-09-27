const test = require('node:test')
const assert = require('node:assert')
const { isPeak, label } = require('../status/peak.js')

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

test('label follows the window', () => {
  assert.equal(label(at('2026-09-28T02:00:00Z')), 'PEAK')
  assert.equal(label(at('2026-09-26T02:00:00Z')), 'OFF-PEAK')
})
