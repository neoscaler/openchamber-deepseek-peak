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

function label(date) {
  return isPeak(date) ? 'PEAK' : 'OFF-PEAK'
}

var api = { isPeak: isPeak, label: label }
if (typeof module !== 'undefined') module.exports = api
else globalThis.openchamberPeakBadge = api
