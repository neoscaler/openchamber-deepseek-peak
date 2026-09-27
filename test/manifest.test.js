const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const { openchamber } = manifest
const PANEL_ID = /^[a-z][a-z0-9-]*$/
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

test('host accepts the manifest shape', () => {
  assert.match(manifest.version, SEMVER)
  assert.equal(openchamber.apiVersion, 1)
  // contributes.panel is required by the schema even without an entry;
  // leaving out panel.entry is what keeps the extension off the rail.
  assert.match(openchamber.contributes.panel.id, PANEL_ID)
  assert.ok(openchamber.contributes.panel.name.length > 0)
  assert.match(openchamber.contributes.panel.icon, PANEL_ID)
  assert.equal(openchamber.contributes.panel.entry, undefined)
})

test('status section points at a packaged html file', () => {
  const section = openchamber.contributes.statusSection
  assert.match(section.entry, /\.html$/)
  assert.ok(fs.existsSync(path.join(root, section.entry)), `${section.entry} missing`)
  assert.ok(section.height >= 24 && section.height <= 320)
})
