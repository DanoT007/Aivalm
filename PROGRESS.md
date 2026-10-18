# AIVALM redesign – stav práce (vetva `claude-redesign`)

Zdroj pravdy pre dizajn: `DESIGN.md`. Stránky sa skladajú cez `python3 tools/build.py` zo `src/pages` + `src/partials` (menu, pätička, rezervácia). Needitovať HTML v koreni ručne.

## Hotové
- Dizajn systém (čierna/biela/sivá, Montserrat self-hosted, GSAP self-hosted)
- `index.html` – rozcestník na 3 produkty + live feed v hero + rezervácia
- `hlasovy-agent.html` – scroll story podľa slajdu „Ako to funguje v praxi“
- `odhad-ceny.html` – hojdajúca sa cenovka (auto/byt prepínač), scenes story, demo formulár (napojený na Make „AUTO demo – odhad výkupnej ceny“)
- `cenove-ponuky.html` – inbox loop v hero, scroll story podľa slajdu „ponuka odchádza sama“, formulár na ukážku
- `spolupraca.html` – formy spolupráce + formulár
- `ochrana-osobnych-udajov.html` – GDPR (dať skontrolovať)
- Pôvodná Lead Radar stránka presunutá do `lead-radar.html`

## Make webhooky (eu1)
- rezervácia callu: hook 3928058, scenár 8032300 „WEB – rezervácia callu“ (sloty z kalendára, rezervácia, potvrdenie s Meet linkom, notifikácia, ochrana pred dvojitou rezerváciou) – otestované
- spolupráca: hook 3928059, scenár 8032260 „WEB – spolupráca“ – otestované
- ukážka dopytu: hook 3928060, scenár 8032364 „WEB – ukážka cenovej ponuky“ (3 odvetvia) – otestované
- POZOR: scenáre s WebhookRespond nesmú mať zapnuté „sequential processing“ (vracajú len „Accepted“)
- odhad auta: existujúci hook 3926425 (scenár 8027094)
- Meet link: https://meet.google.com/fbi-hecg-bpg ; kalendár tomaschdaniel@gmail.com (spojenie 12064600), Gmail aivalm.agent (10823538), Gmail Daniel (12045542)

## Feel layer (hotové)
Lenis smooth scroll, vlastný kurzor (s labelom „Pozrieť“), magnetické tlačidlá, opona pri prechode stránok, filmové zrnenie, bežiaci text riadený rýchlosťou scrollu, 3 produkty vedľa seba s rozťahovaním pri hoveri, slová svietiace pri scrolle.

## Náhľad
https://claude.ai/artifact/FjvVvCMyryYpjEgys4V724 (formuláre v náhľade neodošlú – blokuje to sandbox; na aivalm.com fungujú)

## Ďalej
1. Spätná väzba od Daniela na náhľad
2. Voliteľne 3D objekt (img2threejs) na produktovej stránke
3. Merge `claude-redesign` → `main` (GitHub Pages, aivalm.com) po schválení; zmazať testovací termín 30. 10. 17:30 v kalendári
