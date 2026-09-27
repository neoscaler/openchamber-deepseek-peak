// Hand-rolled slice of @openchamber/sdk: hello and the ready push. No build step.
(function () {
  var CHANNEL = 'openchamber.sdk'
  var API = 1
  var POLL_MS = 1000

  var peak = window.openchamberPeakBadge
  var badge = document.getElementById('badge')
  var label = document.getElementById('label')
  var count = document.getElementById('count')
  // The session's model, "<providerID>/<modelID>"; null hides the badge.
  var model = null
  var seq = 0

  function post(type, payload) {
    var message = { channel: CHANNEL, v: API, type: type }
    if (payload !== undefined) {
      seq += 1
      message.id = seq
      message.payload = payload
    }
    window.parent.postMessage(message, '*')
  }

  function render() {
    var applicable = peak.isDeepSeekProvider(model)
    if (badge.hidden !== !applicable) badge.hidden = !applicable
    if (!applicable) return
    var now = new Date()
    var isPeak = peak.isPeak(now)
    var flag = isPeak ? 'true' : 'false'
    if (badge.dataset.peak !== flag) badge.dataset.peak = flag
    var text = isPeak ? 'PEAK' : 'OFF-PEAK'
    if (label.textContent !== text) label.textContent = text
    var next = peak.nextChange(now)
    var remaining = next ? peak.formatRemaining(next - now) : ''
    if (count.textContent !== remaining) count.textContent = remaining
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return
    var data = event.data
    if (!data || data.channel !== CHANNEL || data.v !== API || data.type !== 'ready') return
    var payload = data.payload || {}
    var tokens = payload.theme && payload.theme.tokens
    if (tokens) {
      var root = document.documentElement.style
      root.setProperty('--oc-warning-text', tokens.warningText)
      root.setProperty('--oc-muted', tokens.muted)
      root.setProperty('--oc-muted-surface', tokens.mutedSurface)
      root.setProperty('--oc-font', tokens.font)
      root.setProperty('--oc-radius', tokens.radius)
    }
    model = payload.session ? payload.session.model || null : null
    render()
  })

  post('hello')
  render()
  setInterval(render, POLL_MS)
})()
