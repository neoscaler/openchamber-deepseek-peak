# openchamber-peak-badge

A [DeepSeek peak / off-peak badge](https://api-docs.deepseek.com/quick_start/pricing) for
[OpenChamber](https://openchamber.dev). One pill in the Work Status panel above the chat,
with the countdown to the next phase change:

```
DeepSeek   ( OFF-PEAK  1:24 )   # neutral label, dimmer counter
DeepSeek   ( PEAK      0:36 )   # warning tone, same pill
```

Nothing else in the section, and nothing on the rail: no service, no API key, no network, no
currency.

## When it shows

Only for the `deepseek` provider itself — a wrapper provider that resells a DeepSeek model
bills its own way, so `opencode/deepseek-v4-flash` stays dark. The host pushes the session on
every state change, so the badge follows the selection live without polling for it.

Hidden when the session has no model yet: before the first prompt of a fresh session the host
reports none, and a badge for the wrong provider is worse than none. The header line itself
always stays — a guest cannot remove its own section (the host draws it, and the smallest
frame is 24 px). To drop the row entirely, switch it off once in the sections dialog behind
the equalizer icon.

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
there for a provider with different hours. The countdown shows minutes and waits out the
weekend: on a Friday evening it counts to Monday 01:00 UTC, the next peak start.

The frame is 24 px, set by `height` in the manifest. The page and the CSS in it stay on one
line; an extension that needs a taller section calls `host.setHeight()` from its page.

## Layout

```
package.json        manifest: statusSection only, apiVersion 1, no capabilities
status/index.html   the page, static CSS
status/peak.js      peak windows, nextChange(), the provider check
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

Tests cover the window boundaries, the weekend rule, the countdown across a weekend, the
provider check, the manifest fields the host rejects installs over, and the handshake the
host sees (`hello`, theme tokens from `ready`, foreign frames ignored).
