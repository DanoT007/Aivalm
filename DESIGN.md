# AIVALM — DESIGN.md

Source of truth for every page on aivalm.com. Read before touching any UI.

## Identity
- Brand: AIVALM. Founder-led Slovak AI studio (Daniel Tomasch). Three products, one promise: no inquiry goes cold.
- Mark: black fleur-de-lis (`assets/img/fleur.png`) + wordmark "AIVALM" set in Montserrat 800.
- Voice: Slovak, vykanie, factual, professional-to-professional. No hype, no exclamation marks, no invented proof.

## Colour (black / white / grey only)
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0B` | text, buttons, dark fields |
| `--paper` | `#FFFFFF` | page ground |
| `--mist` | `#F3F3F3` | surface step (forms, story stage) |
| `--stone` | `#E4E4E4` | input borders, inactive marks |
| `--ash` | `#6B6B6B` | secondary text on white (5.3:1) |
| `--smoke` | `#9A9A9A` | the grey word in headlines (large text only) |
| `--fog` | `#A9A9A9` | secondary text on ink (8:1) |
No other hues. Errors use ink + an icon, not red.

## Type
- One family: **Montserrat**, self-hosted (`assets/fonts`, latin + latin-ext for č ľ ť ž). Never load from Google servers (GDPR).
- Display: 800, tracking -0.035em, leading 0.95. Max two lines at every width.
- Section titles: 800, the slide style: one phrase in ink, the closing word in `--smoke` ("Ako to funguje v **praxi**").
- Body: 500, 17–18px, leading 1.55, max 62ch. Small: 14px 500.

## Layout
- Container 1240px, side gutter 24px (16px on phones). Section gap 140–200px desktop, 96px phone.
- Neighbouring sections never share a composition. No card grids, no eyebrows, no 01/02/03, no gradients, no glass, no resting shadows.
- Surfaces separate by tone step (`--paper` → `--mist` → `--ink`), never by a hairline.

## Components
- Button: pill (999px), flat ink fill, white text, 52px tall. Secondary: ink text with underline offset 6px.
- Nav: fleur + wordmark, product links, "Spolupráca", one action "Rezervovať call".
- Forms: 52px fields, `--stone` 1.5px border, focus = ink border + 3px ink outline offset.

## Motion
- GSAP 3 + ScrollTrigger + DrawSVG, self-hosted in `assets/vendor`.
- Each product page has one signature: the pinned "Ako to funguje v praxi" story rebuilt from the sales-deck slide (icons appear, hand-drawn arrows draw between them, scrubbed by scroll).
- AI odhad ceny signature: a hanging price tag that swings in and rolls its digits.
- Easing `cubic-bezier(.22,1,.36,1)`; press 140ms, hover 180ms, reveals 800ms. Transform/opacity only.
- `prefers-reduced-motion`: no pin, no scrub; every story step shown in its final state.
- Content is never hidden without JS (`html.js` gate).

## Data flows (Make.com, eu1)
- Booking: `WEB – rezervácia callu` webhook (`a=sloty` returns busy times, `a=rezervuj` books).
- Partnership form: `WEB – spolupráca` webhook.
- Price demo: existing `AUTO demo – odhad výkupnej ceny` webhook.
- E-mail demo (Replix, živé): `WEB – Replix živé demo` webhook (hook 3950916, scenár 8100320) – návštevník pošle vlastný dopyt, AI ho spáruje s ukážkovým cenníkom (data store 220566), ceny počíta Make, ponuka príde e-mailom z aivalm.agent; limit 3 ukážky denne na e-mail (data store 227934), odkazy v texte sa odstránia.
- Staré demo `WEB – ukážka cenovej ponuky` (hook 3928060) už web nepoužíva.
Requests are sent as `application/x-www-form-urlencoded` (no CORS preflight).
