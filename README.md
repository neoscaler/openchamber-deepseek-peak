# openchamber-peak-badge

A [DeepSeek peak / off-peak badge](https://api-docs.deepseek.com/quick_start/pricing) for
[OpenChamber](https://openchamber.dev). One pill in the Work Status panel above the chat:

```
DeepSeek billing   ( OFF-PEAK )   # neutral text on a neutral pill
DeepSeek billing   ( PEAK )       # warning tone, same pill
```

The pill keeps the label readable on light and dark themes, and it only appears while the
open session runs a DeepSeek model. Nothing else: no rail icon, no service, no API key, no
network, no currency.

## When it shows

The host pushes the session with every state change, so the badge follows the model live:
pick `deepseek/deepseek-flash` and it appears, switch to another provider and it goes away.
Matching is on the model id, so `opencode/deepseek-v4-flash` counts too.

Not shown when the session has no model yet — before the first prompt of a fresh session the
host reports none, and a badge for the wrong provider is worse than none. The row itself
stays in the panel: a guest cannot remove its own section (the host draws the header, and the
smallest frame is 24 px). To drop it entirely, switch it off once in the sections dialog
behind the equalizer icon.

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
status/peak.js      peak windows, the state() the badge renders, isDeepSeek()
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
