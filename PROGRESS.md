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
- rezervácia callu: hook 3928058 `0di8queev6d1cqlisd70lujsswaiui8l` – scenár TODO
- spolupráca: hook 3928059 `42gkuqfpp97f332ughqe4usm2sgsddxc` – scenár TODO
- ukážka dopytu: hook 3928060 `qti8okd8zj63vuswcwzynva3lnas2urd` – scenár TODO
- odhad auta: existujúci hook 3926425 (scenár 8027094)
- Meet link: https://meet.google.com/fbi-hecg-bpg ; kalendár tomaschdaniel@gmail.com (spojenie 12064600), Gmail aivalm.agent (10823538), Gmail Daniel (12045542)

## Ďalej
1. Make scenáre (rezervácia, spolupráca, ukážka) + test cez webhooky
2. Viac pohybu na hlavnej stránke, kontrola mobilu na všetkých stránkach
3. Náhľad (artifact) pre Daniela, potom merge do main po schválení
