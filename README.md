# openchamber-peak-badge

A [DeepSeek peak / off-peak badge](https://api-docs.deepseek.com/quick_start/pricing) for
[OpenChamber](https://openchamber.dev). One line in the Work Status panel above the chat:

```
DeepSeek billing   PEAK          # warning colour
DeepSeek billing   OFF-PEAK      # muted
```

Nothing else: no rail icon, no service, no API key, no network, no currency.

## Install

OpenChamber → **Settings → Extensions → Add**, then paste one of:

- GitHub (recommended, update checks): `https://github.com/neoscaler/openchamber-peak-badge`
- Local folder (runs from the folder, edit and reload): `/path/to/openchamber-peak-badge`

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
there for a provider with different hours. The badge recomputes every 5 seconds, so a
session that crosses a window boundary flips without a reload.

The frame is 24 px, set by `height` in the manifest. The page and the CSS in it stay on one
line; an extension that needs a taller section calls `host.setHeight()` from its page.

## Layout

```
package.json        manifest: statusSection only, apiVersion 1, no capabilities
status/index.html   the page, static CSS
status/peak.js      peak windows and the state() the badge renders
status/main.js      host handshake and render
test/               node --test, no dependencies
```

The host schema requires `contributes.panel` (id, name, icon) even for an extension that
ships only a section — leaving the block out fails the install with `missing-panel` and
HTTP 400. It is the *absence* of `panel.entry` that keeps the extension off the rail; the
block itself is just identity.

`main.js` speaks the [SDK wire protocol](https://docs.openchamber.dev/sdk/host) directly
(`{ channel: 'openchamber.sdk', v: 1 }` over `postMessage`) instead of depending on
`@openchamber/sdk`. The badge needs two messages — `hello` out, the `ready` push in (its
theme tokens become the CSS variables) — and skipping the dependency keeps the extension
buildless: no npm install, no bundler, no `node_modules`. If OpenChamber bumps the protocol
version, `CHANNEL`/`API` in `status/main.js` are the two lines to touch.

## Development

```bash
npm test        # node --test, nothing to install
```

Tests cover the window boundaries, the weekend rule, the manifest fields the host rejects
installs over, and the handshake the host sees (`hello`, theme tokens from `ready`, foreign
frames ignored).
