// DeepSeek bills at peak rates only inside these UTC windows, weekdays only.
// Same defaults as the OpenCode TUI plugin opencode-peak-badge.
var PEAK_WINDOWS_UTC = [[1, 4], [6, 10]]
var WEEKDAYS_ONLY = true

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

function state(date) {
  var peak = isPeak(date)
  return { label: peak ? 'PEAK' : 'OFF-PEAK', peak: peak }
}

// The host sends "<providerID>/<modelID>". Match the model id so DeepSeek
// models stay tracked behind a wrapper provider too (opencode/deepseek-*).
function isDeepSeek(model) {
  if (typeof model !== 'string') return false
  var slash = model.indexOf('/')
  var id = slash === -1 ? model : model.slice(slash + 1)
  return id.toLowerCase().indexOf('deepseek') === 0
}

var api = { isPeak: isPeak, state: state, isDeepSeek: isDeepSeek }
if (typeof module !== 'undefined') module.exports = api
else globalThis.openchamberPeakBadge = api
