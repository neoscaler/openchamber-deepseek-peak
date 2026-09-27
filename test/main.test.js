const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const MAIN = path.join(__dirname, '..', 'status', 'main.js')
const RealDate = Date

function loadMain({ now = '2026-09-28T05:00:00Z', source = 'host' } = {}) {
  const posted = []
  const listeners = {}
  const badge = {
    textContent: '',
    style: {
      color: '',
      properties: {},
      setProperty(name, value) {
        this.properties[name] = value
      },
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
    body: { scrollHeight: 24 },
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
  return { posted, badge, host, listeners }
}

const find = (posted, type) => posted.filter((message) => message.type === type)

test('announces itself to the host frame', () => {
  const { posted } = loadMain()
  assert.deepEqual(posted[0], { channel: 'openchamber.sdk', v: 1, type: 'hello' })
})

test('renders the current window and asks for its height', () => {
  const offPeak = loadMain()
  assert.equal(offPeak.badge.textContent, 'OFF-PEAK')
  assert.deepEqual(find(offPeak.posted, 'resize')[0].payload, { height: 24 })

  const peak = loadMain({ now: '2026-09-28T02:00:00Z' })
  assert.equal(peak.badge.textContent, 'PEAK')
})

test('takes colours and font from the host theme', () => {
  const { badge, listeners } = loadMain()
  listeners.message({
    source: global.window.parent,
    data: {
      channel: 'openchamber.sdk',
      v: 1,
      type: 'ready',
      payload: { theme: { tokens: { warningText: '#f90', muted: '#888', font: 'Inter' } } },
    },
  })
  assert.equal(badge.style.properties['--oc-warning-text'], '#f90')
  assert.equal(badge.style.properties['--oc-muted'], '#888')
  assert.equal(badge.style.properties['--oc-font'], 'Inter')
})

test('ignores messages that are not from the host frame', () => {
  const { badge, listeners, host } = loadMain({ source: 'other' })
  listeners.message({
    source: host,
    data: {
      channel: 'openchamber.sdk',
      v: 1,
      type: 'ready',
      payload: { theme: { tokens: { warningText: '#f90' } } },
    },
  })
  assert.equal(badge.style.properties['--oc-warning-text'], undefined)
})
