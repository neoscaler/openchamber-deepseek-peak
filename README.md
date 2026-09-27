# openchamber-deepseek-peak

A [DeepSeek peak / off-peak badge](https://api-docs.deepseek.com/quick_start/pricing) for
[OpenChamber](https://openchamber.dev). It sits in the Work Status panel above the chat under
the DeepSeek mark, with the countdown to the next phase change:

```
DeepSeek Pricing   [OFF-PEAK] Switch 1:24:10   # neutral label, dimmer counter
DeepSeek Pricing   [PEAK]     Switch 0:36:00   # warning tone
```

The brackets frame the label, so nothing needs a fill of its own. The page sets `color-scheme`
from the host theme on every `ready` — without it the iframe draws its own white canvas in
dark mode. The countdown shows seconds and snaps to ten of them, matching how often the page
redraws. Nothing else in the section, and nothing on the rail: no service, no API key, no
network, no currency.

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

- GitHub (recommended, update checks): `https://github.com/neoscaler/openchamber-deepseek-peak`
- Local folder (runs from the folder, edit and reload): `/path/to/openchamber-deepseek-peak`

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
there for a provider with different hours. The countdown waits out the weekend: on a Friday
evening it counts to Monday 01:00 UTC, the next peak start.

The frame is 24 px, set by `height` in the manifest. The page and the CSS in it stay on one
line; an extension that needs a taller section calls `host.setHeight()` from its page.

## Timezones

Everything runs on UTC, so the machine's zone does not enter into it: the windows are read
with `getUTCDay`/`getUTCHours`, the flip instants are built with `Date.UTC`, and the counter
is the difference between two absolute instants. A zone with a half-hour offset, a zone at
+14, and a zone that shifts for daylight saving all produce the same answer.

The weekend rule is UTC too, and that matches DeepSeek: the two windows land on 09:00–12:00
and 14:00–18:00 Beijing time, the same weekday as in UTC, so "weekday" means the same thing in
both. Beijing has no daylight saving, so nothing shifts there either.

Because the countdown is recomputed from the clock instead of decremented, a sleeping laptop
or a timezone change mid-session shows the right value on the next redraw.
`test/timezone.test.js` runs the same instants under UTC, `America/Los_Angeles`,
`Asia/Kolkata` (+05:30) and `Pacific/Kiritimati` (+14) in separate processes, checks that each
zone really applied, and that all four agree.

## Layout

```
package.json        manifest: statusSection only, apiVersion 1, no capabilities
icon.svg            the DeepSeek mark, drawn as a currentColor mask by the host
status/index.html   the page, static CSS
status/peak.js      peak windows, nextChange(), the provider check
status/main.js      host handshake and render
test/               node --test, no dependencies
```

The header icon is DeepSeek's own mark. The host draws a package SVG as a CSS mask filled
with `currentColor` (`GuestRailIcon`), so the file's own colour never shows: the mark takes the
muted text colour of the header and therefore works unchanged in the light and the dark theme.
What matters is the crop, and this one is taken from
[openchamber-deepseek-usage](https://github.com/shusongLu/openchamber-deepseek-usage) (MIT),
whose tight `viewBox` makes the mark fill the 16 px slot instead of floating in it. The mark
itself stays DeepSeek's; the extension only uses it to say which provider the row is about.

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
provider check, timezone independence, the manifest fields the host rejects installs over
(including a package icon that has to exist), and the handshake the host sees (`hello`, theme
tokens and `color-scheme` from `ready`, foreign frames ignored).
