// Hand-rolled slice of @openchamber/sdk: hello and the ready push. No build step.
(function () {
  var CHANNEL = 'openchamber.sdk'
  var API = 1
  var POLL_MS = 5000

  var badge = document.getElementById('badge')
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
    var state = window.openchamberPeakBadge.state(new Date())
    if (badge.textContent !== state.label) badge.textContent = state.label
    var peak = state.peak ? 'true' : 'false'
    if (badge.dataset.peak !== peak) badge.dataset.peak = peak
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return
    var data = event.data
    if (!data || data.channel !== CHANNEL || data.v !== API || data.type !== 'ready') return
    var tokens = data.payload && data.payload.theme && data.payload.theme.tokens
    if (tokens) {
      var root = document.documentElement.style
      root.setProperty('--oc-warning-text', tokens.warningText)
      root.setProperty('--oc-muted', tokens.muted)
      root.setProperty('--oc-font', tokens.font)
    }
    render()
  })

  post('hello')
  render()
  setInterval(render, POLL_MS)
})()
