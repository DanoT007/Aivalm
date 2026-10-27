# AIVALM — DESIGN.md

Source of truth for every page on aivalm.com. Read before touching any UI.

## Identity
- Brand: AIVALM, one product: **Replix** (automatic price quotes from e-mail inquiries for wholesalers and distributors). Since 27. 10. 2026 the site is a single page about Replix; the voice agent and price estimate were removed. Founder-led (Daniel Tomasch).
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
- Nav: fleur + wordmark, one text link "Spolupráca", one action "Dohodnúť stretnutie" ("Stretnutie" on phones). No product router, no hamburger.
- Forms: 52px fields, `--stone` 1.5px border, focus = ink border + 3px ink outline offset.

## Motion
- GSAP 3 + ScrollTrigger + DrawSVG, self-hosted in `assets/vendor`.
- Signature moment: the live demo in the hero (`assets/js/demo.js`). The sample inquiry types itself once, the visitor adds an e-mail, the window shows live steps with a timer and then renders the real offer returned by Make, with an "approve" step. Everything else stays quiet.
- Second: the pinned "Od dopytu po odoslanú ponuku" story (icons appear, hand-drawn arrows draw, scrubbed by scroll).
- Easing `cubic-bezier(.22,1,.36,1)`; press 140ms, hover 180ms, reveals 800ms. Transform/opacity only.
- `prefers-reduced-motion`: no pin, no scrub; every story step shown in its final state.
- Content is never hidden without JS (`html.js` gate).

## Data flows (Make.com, eu1)
- Booking: `WEB – rezervácia callu` webhook (`a=sloty` returns busy times, `a=rezervuj` books).
- Partnership form: `WEB – spolupráca` webhook.
- E-mail demo (Replix, živé): `WEB – Replix živé demo` webhook (hook 3950916, scenár 8100320) – návštevník pošle dopyt na akýkoľvek tovar alebo službu, AI k nemu vytvorí ilustračný cenník a priradí položky, zľavy, súčty a DPH počíta Make (data store 220566 sa už nepoužíva), webhook odpovedá JSON-om s ponukou (typ ponuka/nedopyt, riadky, súčty) a web ju vykreslí v okne ukážky; kópia ide e-mailom z aivalm.agent; limit 20 ukážok denne na e-mail (data store 227934), odkazy v texte sa odstránia. Ak webhook vráti niečo iné (limit, chyba), web ukáže „ponuka je na ceste do schránky“.
- Staré demo `WEB – ukážka cenovej ponuky` (hook 3928060) už web nepoužíva.
Requests are sent as `application/x-www-form-urlencoded` (no CORS preflight).
