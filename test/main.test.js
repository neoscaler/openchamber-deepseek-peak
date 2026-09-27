const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const MAIN = path.join(__dirname, '..', 'status', 'main.js')
const RealDate = Date

function loadMain({ now = '2026-09-28T05:00:00Z', source = 'host' } = {}) {
  const posted = []
  const listeners = {}
  const nodes = {
    badge: { dataset: {}, hidden: true },
    label: { textContent: '' },
    count: { textContent: '' },
  }
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
    getElementById: (id) => nodes[id] ?? null,
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
  return { posted, nodes, rootStyle, host, listeners, send }
}

const ready = (session, tokens) => ({
  channel: 'openchamber.sdk',
  v: 1,
  type: 'ready',
  payload: { session, theme: { tokens: tokens ?? {} } },
})

const deepseek = { id: 'ses-1', model: 'deepseek/deepseek-flash' }

test('announces itself to the host frame', () => {
  const { posted } = loadMain()
  assert.deepEqual(posted[0], { channel: 'openchamber.sdk', v: 1, type: 'hello' })
})

test('stays hidden while the model is unknown', () => {
  const { nodes } = loadMain()
  assert.equal(nodes.badge.hidden, true)
  assert.equal(nodes.label.textContent, '')
})

test('shows off-peak neutrally and peak in the warning state', () => {
  const offPeak = loadMain({ now: '2026-09-28T05:00:00Z' })
  offPeak.send(ready(deepseek))
  assert.equal(offPeak.nodes.badge.hidden, false)
  assert.equal(offPeak.nodes.badge.dataset.peak, 'false')
  assert.equal(offPeak.nodes.label.textContent, '[OFF-PEAK]')

  const peak = loadMain({ now: '2026-09-28T02:00:00Z' })
  peak.send(ready(deepseek))
  assert.equal(peak.nodes.badge.dataset.peak, 'true')
  assert.equal(peak.nodes.label.textContent, '[PEAK]')
})

test('counts down to the phase change', () => {
  const { nodes, send } = loadMain({ now: '2026-09-28T02:00:00Z' })
  send(ready(deepseek))
  assert.equal(nodes.count.textContent, 'Switch 2:00:00')

  const across = loadMain({ now: '2026-09-28T02:59:30Z' })
  across.send(ready(deepseek))
  assert.equal(across.nodes.count.textContent, 'Switch 1:00:30')
})

test('hides for any other provider, including resold DeepSeek models', () => {
  const { nodes, send } = loadMain()
  send(ready(deepseek))
  assert.equal(nodes.badge.hidden, false)
  send(ready({ id: 'ses-1', model: 'opencode/deepseek-v4-flash' }))
  assert.equal(nodes.badge.hidden, true)
  send(ready({ id: 'ses-1', model: 'openai/gpt-5' }))
  assert.equal(nodes.badge.hidden, true)
  send(ready(null))
  assert.equal(nodes.badge.hidden, true)
})

test('takes colours, font and radius from the host theme', () => {
  const { rootStyle, send } = loadMain()
  send(ready(deepseek, {
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
  listeners.message({ source: {}, data: ready(deepseek, { warningText: '#f90' }) })
  assert.equal(rootStyle.properties['--oc-warning-text'], undefined)
})
