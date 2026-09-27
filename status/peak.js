// DeepSeek bills at peak rates only inside these UTC windows, weekdays only.
// Same defaults as the OpenCode TUI plugin opencode-peak-badge.
var PEAK_WINDOWS_UTC = [[1, 4], [6, 10]]
var WEEKDAYS_ONLY = true

// Every UTC hour a phase can flip on: window starts and ends, plus the
// weekday boundary that ends the weekend's continuous off-peak stretch.
var FLIP_HOURS_UTC = [0, 1, 4, 6, 10]

function isPeak(date) {
  if (WEEKDAYS_ONLY) {
    var day = date.getUTCDay()
    if (day === 0 || day === 6) return false
  }
  var hour = date.getUTCHours()
  for (var i = 0; i < PEAK_WINDOWS_UTC.length; i += 1) {
    if (hour >= PEAK_WINDOWS_UTC[i][0] && hour < PEAK_WINDOWS_UTC[i][1]) return true
  }
  return false
}

// The host sends "<providerID>/<modelID>". Only the DeepSeek provider itself
// counts; a wrapper provider that resells a DeepSeek model bills its own way.
function isDeepSeekProvider(model) {
  if (typeof model !== 'string') return false
  var slash = model.indexOf('/')
  if (slash <= 0) return false
  return model.slice(0, slash).toLowerCase() === 'deepseek'
}

// When the current phase ends. Scans the next nine UTC days' flip hours, so a
// Friday evening counts down across the weekend to Monday 01:00 UTC.
function nextChange(date) {
  var now = date.getTime()
  var base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  var current = isPeak(date)
  var found = null
  for (var day = 0; day <= 8; day += 1) {
    for (var i = 0; i < FLIP_HOURS_UTC.length; i += 1) {
      var at = base + day * 86400000 + FLIP_HOURS_UTC[i] * 3600000
      if (at <= now) continue
      if (isPeak(new Date(at)) === current) continue
      if (found === null || at < found) found = at
    }
  }
  return found === null ? null : new Date(found)
}

function formatRemaining(ms) {
  // Rounded up: the badge should not read 0:00 while the phase still runs.
  var minutes = Math.max(0, Math.ceil(ms / 60000))
  var hours = Math.floor(minutes / 60)
  var rest = minutes % 60
  return hours + ':' + (rest < 10 ? '0' : '') + rest
}

var api = {
  isPeak: isPeak,
  isDeepSeekProvider: isDeepSeekProvider,
  nextChange: nextChange,
  formatRemaining: formatRemaining,
}
if (typeof module !== 'undefined') module.exports = api
else globalThis.openchamberPeakBadge = api
