# AIVALM redesign – stav práce (vetva `claude-redesign`)

Zdroj pravdy pre dizajn: `DESIGN.md`. Stránky sa skladajú cez `python3 tools/build.py` zo `src/pages` + `src/partials` (menu, pätička, rezervácia). Needitovať HTML v koreni ručne.

## Hotové
- Dizajn systém (čierna/biela/sivá, Montserrat self-hosted, GSAP self-hosted)
- `index.html` – úvod („AI, ktorá vybaví vašich zákazníkov…“), 3 statické produktové karty s „Pre koho“, „Ako prebieha zákazka krok za krokom“, „Kto za tým stojí“, rezervácia
- `hlasovy-agent.html` – scroll story podľa slajdu „Ako to funguje v praxi“
- `odhad-ceny.html` – hojdajúca sa cenovka (auto/byt prepínač), scenes story, demo formulár (napojený na Make „AUTO demo – odhad výkupnej ceny“)
- `cenove-ponuky.html` – inbox loop v hero, scroll story podľa slajdu „ponuka odchádza sama“, formulár na ukážku
- `spolupraca.html` – formy spolupráce + formulár
- `ochrana-osobnych-udajov.html` – GDPR (dať skontrolovať)
- Starý web (Lead Radar) zmazaný pri spustení 18. 10. – je v histórii gitu (commit f9a37fe)

## Make webhooky (eu1)
- rezervácia callu: hook 3928058, scenár 8032300 „WEB – rezervácia callu“ (sloty z kalendára, rezervácia, potvrdenie s Meet linkom, notifikácia, ochrana pred dvojitou rezerváciou) – otestované
- spolupráca: hook 3928059, scenár 8032260 „WEB – spolupráca“ – otestované
- ukážka dopytu: hook 3928060, scenár 8032364 „WEB – ukážka cenovej ponuky“ (3 odvetvia) – otestované
- POZOR: scenáre s WebhookRespond nesmú mať zapnuté „sequential processing“ (vracajú len „Accepted“)
- odhad auta: existujúci hook 3926425 (scenár 8027094)
- Meet link: https://meet.google.com/fbi-hecg-bpg ; kalendár tomaschdaniel@gmail.com (spojenie 12064600), Gmail aivalm.agent (10823538), Gmail Daniel (12045542)

## Feel layer (hotové)
- Desktop: Lenis smooth scroll, kurzor (čierny na svetlom, biely na tmavom, pri hoveri len mierne zväčšenie, bez labelu), magnetické tlačidlá, opona pri prechode stránok, filmové zrnenie
- Mobil/dotyk: bez Lenis a zrnenia (výkon), natívny scroll, horizontálny posun zamknutý
- Odstránené na želanie: label „Pozrieť“, scramble textu, hover animácie produktových kariet, marquee/feed na úvode
- Odkazy v rámci stránky (#…): vlastný plynulý posun v `fx.js` (`glideTo`) – posúva sa `main`+pätička ako GPU vrstva (translate3d), reálny scroll sa nastaví až na konci (žiadne sekanie), easeInOutCubic, dĺžka podľa vzdialenosti (~1,9 s na jednu obrazovku, 3–3,5 s dlhé), pinované story sa pri prechode stmavia (`.is-skipping`) a prejdú rýchlejšie; prerušiteľné kolieskom/dotykom; poistka timeoutom
- Každá stránka sa otvára hore (alebo na #kotve); stránky bez rezervácie posielajú CTA na `index.html#rezervacia`
- Mobilné menu: tenké názvy produktov + „Pre koho“, tlačidlo „Rezervovať bezplatný hovor“; scroll lock cez `html.menu-open` (nie body – to rozbíjalo sticky lištu)
- Prechod stránok: desktop čierna opona; dotyk sivý závoj s gradientom na začiatku, čierne logo, ~1,2 s (fade, bez posunu)

## Názvy produktov
AI hlasový agent · AI odhad ceny · AI cenové ponuky

## Náhľad
https://claude.ai/artifact/FjvVvCMyryYpjEgys4V724 (formuláre v náhľade neodošlú – blokuje to sandbox; na aivalm.com fungujú)

## Ďalej
1. Spätná väzba od Daniela na náhľad (QA 18. 10.: všetky stránky bez chýb v konzole, bez pretečenia na 390 px, príbehy bez prekryvov pri 1280×720)
1b. Voliteľne portrétna fotka do „Kto za tým stojí“
2. Voliteľne 3D objekt (img2threejs) na produktovej stránke
3. ✅ Spustené na main (aivalm.com) 18. 10.

## Zmeny 19. 10. (spätná väzba od Raymonda a Mateja)
- Úvod: sekcia „Naše služby“ + „Vyberte si svoj segment“, všeobecnejšie texty kariet; na desktope sa karta pod kurzorom zväčší o 4 %, ostatné ustúpia
- „Ako prebieha zákazka“: 1 Predstavenie a konzultácia · 2 Analýza a nastavenie (niekoľko dní) · 3 Skúška a spustenie
- AI cenové ponuky: príbeh „Kto odpovie prvý, ten predá“ (kancelársky nábytok, 4 dodávatelia) s animovanou kartou – z Canva prezentácie „E-mailová automatizácia pre obchodné firmy“
- Rezervácia → „Dohodnime si stretnutie, online alebo osobne“: online 30 min (Meet), osobne 60 min v Tower 5 (Kalinčiakova 33, 831 04 Bratislava) alebo u klienta (adresa povinná); všetky „15 min call“ CTA → „Dohodnúť stretnutie“
- Make 8032300 premenovaný na „WEB – rezervácia stretnutia“: dĺžka 30/60, miesto/Meet v udalosti aj e-mailoch, posledný osobný začiatok 17:00; potvrdenia klientom aj zo spolupráce (8032260) odchádzajú z aivalm.agent@gmail.com
- Na webe všade aivalm.agent@gmail.com namiesto osobného Gmailu; v pätičke adresa kancelárie
- Testovacie udalosti (29. 10. a starý 30. 10. 17:30) zmazané z kalendára
- Čaká sa: fotky/video z kancelárie, YouTube video k hlasovému agentovi
