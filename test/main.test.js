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
  const FrozenDate = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [frozen]))
    }
  }
  delete require.cache[require.resolve(MAIN)]
  global.Date = FrozenDate
  try {
    require(MAIN)
  } finally {
    global.Date = RealDate
  }
  // render() runs on every push, so the frozen clock has to be in place then too.
  const send = (data) => {
    global.Date = FrozenDate
    try {
      listeners.message({ source: global.window.parent, data })
    } finally {
      global.Date = RealDate
    }
  }
  return { posted, badge, rootStyle, host, listeners, send }
}

const ready = (session, tokens) => ({
  channel: 'openchamber.sdk',
  v: 1,
  type: 'ready',
  payload: { session, theme: { tokens: tokens ?? {} } },
})

test('announces itself to the host frame', () => {
  const { posted } = loadMain()
  assert.deepEqual(posted[0], { channel: 'openchamber.sdk', v: 1, type: 'hello' })
})

test('stays hidden while the model is unknown', () => {
  const { badge } = loadMain()
  assert.equal(badge.textContent, '')
  assert.equal(badge.dataset.peak, 'none')
})

test('renders the window for a DeepSeek session', () => {
  const offPeak = loadMain()
  offPeak.send(ready({ id: 'ses-1', model: 'deepseek/deepseek-flash' }))
  assert.equal(offPeak.badge.textContent, 'OFF-PEAK')
  assert.equal(offPeak.badge.dataset.peak, 'false')

  const peak = loadMain({ now: '2026-09-28T02:00:00Z' })
  peak.send(ready({ id: 'ses-1', model: 'deepseek/deepseek-flash' }))
  assert.equal(peak.badge.textContent, 'PEAK')
  assert.equal(peak.badge.dataset.peak, 'true')
})

test('hides again when the session switches provider', () => {
  const { badge, send } = loadMain()
  send(ready({ id: 'ses-1', model: 'deepseek/deepseek-flash' }))
  assert.equal(badge.dataset.peak, 'false')
  send(ready({ id: 'ses-1', model: 'openai/gpt-5' }))
  assert.equal(badge.textContent, '')
  assert.equal(badge.dataset.peak, 'none')
  send(ready(null))
  assert.equal(badge.dataset.peak, 'none')
})

test('takes colours, font and radius from the host theme', () => {
  const { rootStyle, send } = loadMain()
  send(ready({ id: 'ses-1', model: 'deepseek/deepseek-flash' }, {
    warningText: '#f90',
    muted: '#888',
    mutedSurface: '#222',
    font: 'Inter',
    radius: '8px',
  }))
  assert.equal(rootStyle.properties['--oc-warning-text'], '#f90')
  assert.equal(rootStyle.properties['--oc-muted'], '#888')
  assert.equal(rootStyle.properties['--oc-muted-surface'], '#222')
  assert.equal(rootStyle.properties['--oc-font'], 'Inter')
  assert.equal(rootStyle.properties['--oc-radius'], '8px')
})

test('ignores messages that are not from the host frame', () => {
  const { rootStyle, listeners } = loadMain()
  listeners.message({
    source: {},
    data: ready({ id: 'ses-1', model: 'deepseek/deepseek-flash' }, { warningText: '#f90' }),
  })
  assert.equal(rootStyle.properties['--oc-warning-text'], undefined)
})
