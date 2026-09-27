// Hand-rolled slice of @openchamber/sdk: hello, ready, resize. No build step.
(function () {
  var CHANNEL = 'openchamber.sdk'
  var API = 1
  var MIN_HEIGHT = 24
  var MAX_HEIGHT = 320
  var POLL_MS = 30000

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

  function resize() {
    var height = Math.ceil(document.body.scrollHeight) || MIN_HEIGHT
    post('resize', { height: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height)) })
  }

  function render() {
    var text = window.openchamberPeakBadge.label(new Date())
    if (badge.textContent !== text) badge.textContent = text
    badge.style.color = window.openchamberPeakBadge.isPeak(new Date())
      ? 'var(--oc-warning-text)'
      : 'var(--oc-muted)'
    resize()
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return
    var data = event.data
    if (!data || data.channel !== CHANNEL || data.v !== API || data.type !== 'ready') return
    var tokens = data.payload && data.payload.theme && data.payload.theme.tokens
    if (tokens) {
      badge.style.setProperty('--oc-warning-text', tokens.warningText)
      badge.style.setProperty('--oc-muted', tokens.muted)
      badge.style.setProperty('--oc-font', tokens.font)
    }
    render()
  })

  post('hello')
  render()
  setInterval(render, POLL_MS)
})()
