const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const MAIN = path.join(__dirname, '..', 'status', 'main.js')
const RealDate = Date

function loadMain({ now = '2026-09-28T05:00:00Z', source = 'host' } = {}) {
  const posted = []
  const listeners = {}
  const badge = { textContent: '', dataset: {} }
  const rootStyle = {
    properties: {},
    setProperty(name, value) {
      this.properties[name] = value
    },
  }
  const host = { postMessage: (message) => posted.push(message) }

  // Im Browser ist window === globalThis; peak.js haengt darum an globalThis.
  global.window = global
  global.parent = source === 'host' ? host : { postMessage: () => {} }
  global.addEventListener = (type, handler) => {
    listeners[type] = handler
  }
  global.document = {
    getElementById: (id) => (id === 'badge' ? badge : null),
    documentElement: { style: rootStyle },
  }
  global.setInterval = () => 0
  global.openchamberPeakBadge = require('../status/peak.js')
  const frozen = new RealDate(now).getTime()
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [frozen]))
    }
  }
  delete require.cache[require.resolve(MAIN)]
  try {
    require(MAIN)
  } finally {
    global.Date = RealDate
  }
  return { posted, badge, rootStyle, host, listeners }
}

const ready = (tokens) => ({
  channel: 'openchamber.sdk',
  v: 1,
  type: 'ready',
  payload: { theme: { tokens } },
})

test('announces itself to the host frame', () => {
  const { posted } = loadMain()
  assert.deepEqual(posted[0], { channel: 'openchamber.sdk', v: 1, type: 'hello' })
})

test('renders the current window', () => {
  const offPeak = loadMain()
  assert.equal(offPeak.badge.textContent, 'OFF-PEAK')
  assert.equal(offPeak.badge.dataset.peak, 'false')

  const peak = loadMain({ now: '2026-09-28T02:00:00Z' })
  assert.equal(peak.badge.textContent, 'PEAK')
  assert.equal(peak.badge.dataset.peak, 'true')
})

test('takes colours and font from the host theme', () => {
  const { rootStyle, listeners } = loadMain()
  listeners.message({
    source: global.window.parent,
    data: ready({ warningText: '#f90', muted: '#888', font: 'Inter' }),
  })
  assert.equal(rootStyle.properties['--oc-warning-text'], '#f90')
  assert.equal(rootStyle.properties['--oc-muted'], '#888')
  assert.equal(rootStyle.properties['--oc-font'], 'Inter')
})

test('ignores messages that are not from the host frame', () => {
  const { rootStyle, listeners, host } = loadMain({ source: 'other' })
  listeners.message({ source: host, data: ready({ warningText: '#f90' }) })
  assert.equal(rootStyle.properties['--oc-warning-text'], undefined)
})
