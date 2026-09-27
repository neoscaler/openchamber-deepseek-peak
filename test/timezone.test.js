const test = require('node:test')
const assert = require('node:assert')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const PEAK = path.join(__dirname, '..', 'status', 'peak.js')

// Instant in, verdict out. Every zone must agree, because DeepSeek defines the
// windows in UTC and the page reads the clock in UTC throughout.
const INSTANTS = [
  '2026-09-25T09:59:00Z', // Friday, still inside the morning window
  '2026-09-25T10:00:00Z', // Friday, start of the weekend-long off-peak stretch
  '2026-09-26T02:00:00Z', // Saturday
  '2026-09-27T03:00:00Z', // Sunday
  '2026-09-28T01:00:00Z', // Monday, start of the first window
  '2026-09-28T04:00:00Z',
  '2026-09-28T06:30:00Z',
  '2026-09-28T23:59:59Z',
]

const EXPECTED_OFFSETS = {
  UTC: 0,
  'America/Los_Angeles': 420, // PDT
  'Asia/Kolkata': -330, // +05:30
  'Pacific/Kiritimati': -840, // +14:00
}

const EXPECTED = [
  [true, '2026-09-25T10:00:00.000Z', '0:01:00'],
  [false, '2026-09-28T01:00:00.000Z', '63:00:00'],
  [false, '2026-09-28T01:00:00.000Z', '47:00:00'],
  [false, '2026-09-28T01:00:00.000Z', '22:00:00'],
  [true, '2026-09-28T04:00:00.000Z', '3:00:00'],
  [false, '2026-09-28T06:00:00.000Z', '2:00:00'],
  [true, '2026-09-28T10:00:00.000Z', '3:30:00'],
  [false, '2026-09-29T01:00:00.000Z', '1:00:10'],
]

const SCRIPT = `
const peak = require(${JSON.stringify(PEAK)})
const instants = ${JSON.stringify(INSTANTS)}
const rows = instants.map((iso) => {
  const at = new Date(iso)
  const next = peak.nextChange(at)
  return [peak.isPeak(at), next && next.toISOString(), peak.formatRemaining(next - at)]
})
console.log(JSON.stringify({ offset: new Date(instants[0]).getTimezoneOffset(), rows }))
`

const run = (zone) => JSON.parse(execFileSync(process.execPath, ['-e', SCRIPT], {
  env: { ...process.env, TZ: zone },
  encoding: 'utf8',
}))

test('the zones in the fixture are the ones the run used', () => {
  for (const [zone, offset] of Object.entries(EXPECTED_OFFSETS)) {
    assert.equal(run(zone).offset, offset, `${zone} did not apply`)
  }
})

test('every timezone gives the same phase and countdown', () => {
  for (const zone of Object.keys(EXPECTED_OFFSETS)) {
    assert.deepEqual(run(zone).rows, EXPECTED, zone)
  }
})
