# openchamber-peak-badge

A [DeepSeek peak / off-peak badge](https://api-docs.deepseek.com/quick_start/pricing) for
[OpenChamber](https://openchamber.dev). One line in the Work Status panel above the chat:

```
DeepSeek billing   PEAK          # warning colour
DeepSeek billing   OFF-PEAK      # muted
```

Nothing else: no panel, no rail icon, no service, no API key, no network, no currency.

## Install

OpenChamber → **Settings → Extensions → Add**, then paste one of:

- GitHub (recommended, update checks): `https://github.com/neoscaler/openchamber-peak-badge`
- Local folder (runs from the folder, edit and reload): `/home/neoscaler/repositories/openchamber-peak-badge`

Needs OpenChamber **2.0.1+** (`contributes.statusSection`). The dialog asks for no
capabilities, so there is nothing to approve.

## Peak hours

DeepSeek bills at peak rates on weekdays only, in two UTC windows:

| | UTC | Berlin (CEST) |
| --- | --- | --- |
| Peak | 01:00–04:00 and 06:00–10:00 | 03:00–06:00 and 08:00–12:00 |
| Off-peak | everything else, half price | |

Same windows as the OpenCode TUI plugin [opencode-peak-badge](https://github.com/hugobatista/opencode-peak-badge),
so both badges agree. They are the two constants at the top of `status/peak.js`; change them
there for a provider with different hours. The badge recomputes every 30 seconds, so a
session that crosses a window boundary flips without a reload.

## Layout

```
package.json        manifest: statusSection only, apiVersion 1, no capabilities
status/index.html   the page, static CSS
status/peak.js      peak windows and label
status/main.js      host handshake and render
test/               node --test, no dependencies
```

`main.js` speaks the [SDK wire protocol](https://docs.openchamber.dev/sdk/host) directly
(`{ channel: 'openchamber.sdk', v: 1 }` over `postMessage`) instead of depending on
`@openchamber/sdk`. The badge needs three messages — `hello`, the `ready` push, and
`resize` — and skipping the dependency keeps the extension buildless: no npm install, no
bundler, no `node_modules`. If OpenChamber bumps the protocol version, `CHANNEL`/`API` in
`status/main.js` are the two lines to touch.

## Development

```bash
npm test        # node --test, nothing to install
```

Tests cover the window boundaries, the weekend rule, and the handshake the host sees
(`hello`, `resize`, theme tokens from `ready`, foreign frames ignored).
