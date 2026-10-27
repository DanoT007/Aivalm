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
AI hlasový agent · AI odhad ceny · Replix (od 21. 10., predtým AI cenové ponuky; súbor ostáva cenove-ponuky.html)

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
- Hlasový agent: karta s hovorom v úvode na mobile skrytá (duplicita s príbehom)
- Hlasový agent na mobile: samostatný príbeh #prax-m „Ako to funguje na príklade“ (5 scén v telefóne: notifikácia 21:47 → hovor → profil záujemcu → termín + SMS → Vy vs. makléri 2–5), desktop #prax ostáva (data-only); pod tým animácia 21× (počítadlo + pruhy, scrub)
- 19. 10. večer: telefón +421 948 475 484 na webe (pätička, Kto za tým stojí, GDPR, chybové hlášky) a v podpise všetkých e-mailov (rezervácia, spolupráca, ukážka ponuky); upozornenie Danielovi na tomaschdaniel@gmail.com má predmet „🔔 Nový booking (online/osobne): termín · meno“ a tlačidlá Zavolať klientovi / Odpísať; .nojekyll pridaný (Pages nasadzuje bez Jekyllu)
- Film lalie z úvodu hlavnej stránky odstránený (Daniel sa mu nepáčil); úvod je opäť jednostĺpcový, na mobile zarovnaný na stred (.hero--center)
- Hlavná stránka: sekcia #cennik „Orientačné ceny“ nad rezerváciou — hlasový agent od 149 €/mes. + nastavenie od 700 €, odhad ceny od 100 €/mes. + od 500 €, cenové ponuky nastavenie od 300 € + mesačne podľa objemu
- Produktové stránky: vlastná sekcia #cena „Koľko to stojí“ (sivé pozadie) nad spodnými formulármi — čierna karta s cenou (počítadlo, odškrtávanie „V cene“, jemný lesk), vľavo „Od čoho závisí cena“ (3 body); hlasový agent 149 €/mes. + 699 €, odhad 99 €/mes. + 499 €, cenové ponuky nastavenie 299 € + mesačne podľa objemu; pás „Počujte ho naživo“ je teraz biely
- Ceny vždy končiť na 9 (99/95): 149 €/mes. + 699 €, 99 €/mes. + 499 €, nastavenie od 299 €
- Demo sekcie na odhade a cenových ponukách: na PC formulár vľavo, text vpravo (.split--flip); rezervácia stretnutia ostáva text vľavo, formulár vpravo; mobil bez zmeny
- Hlavná stránka: nadpis a text sekcie „Orientačné ceny“ zarovnané na stred
- Rezervácia (všetky stránky): fotka Tower 5 (farebná, oblé rohy) + „Naša kancelária / Tower 5, Kalinčiakova 33, 831 04 Bratislava / Otvoriť v mapách“ na stred pod fotkou
- 20. 10.: hlavná stránka – v „Kto za tým stojí“ portrét Daniela vpravo (farebný, oblé rohy, `assets/img/daniel.jpg`); na mobile pod textom. Len na tomto jednom mieste.

## Zmeny 21. 10. – Replix je hlavný produkt
- AI cenové ponuky premenované na **Replix** (menu, pätička, rezervácia, spolupráca, úvod)
- cenove-ponuky.html: hero „Každý dopyt zodpovedaný do 2 minút. Aj o polnoci.“ + značka Replix nad nadpisom + pilulka pilotu
- Cena odstránená → sekcia #pilot „Najprv výsledky, potom cena“: 0 € prvé 3 mesiace pre prvých 5 firiem, 4 kroky pilotu
- Počítadlo miest: `data-seats="0"` v sekcii #pilot – keď pribudne firma, zvýšiť číslo (pri 0 sa pruh nezobrazuje, text „Voľné miesta: X z 5“ sa dopočíta)
- Nová sekcia #pre-koho: odvetvia + „sedí vám, ak / skôr nie, ak“ (filter zlých leadov)
- Živé demo #ukazka: predvyplnený predmet a text (dá sa prepísať), návštevník doplní e-mail → animácia obálky + časovač, ponuka príde do 2 min (Make 8100320)
- Úvod: pilulka „Novinka: Replix“ v hero, karta Replix ako prvá, v orientačných cenách „Replix · pilot 0 € prvé 3 mesiace“
- Kalkulačka strát: zatiaľ nie, čaká sa na názor Raymonda

## Zmeny 21. 10. večer
- Menu (PC aj mobil) a pätička: Replix prvý; „Spolupráca“ vyradená z horného a mobilného menu (stránka spolupraca.html ostáva, odkaz je v pätičke)
- Úvod: pilulka „Novinka: Replix“ sivá (--stone, čierny text a bodka); len v hero úvodu, na stránke Replix ostáva čierna
- Úvod „Naše služby“ aj „Orientačné ceny“: poradie odhad ceny · **Replix (čierna karta, v strede)** · hlasový agent
- „Kto za tým stojí“: fotka na PC posunutá doľava (margin-right clamp 40–110 px), mobil bez zmeny
- Replix stránka: medzera medzi #pre-koho a „Presné, nie len rýchle“ skrátená (z ~380 px na ~90 px pri 1440 px)
- Replix hero: „Vyskúšať naživo“ nad/pred tlačidlom „Dohodnúť stretnutie“
- Všetky stránky: krúžok s % prescrollovania vpravo dole (.sprog v site.js/site.css), objaví sa po 120 px, klik = späť hore, v otvorenom mobilnom menu skrytý

## Zmeny 22. 10.
- Replix: sekcia #kalkulacka „Pomalá ponuka je stratená zákazka“ medzi „Presné, nie len rýchle“ a pilotným programom – kalkulačka výnosov vľavo (dopyty/mes × priemerná objednávka × % stratených, predvolene 300 × 800 € × 20 %), text vpravo, tlačidlo „Overiť to na mojich dátach“ → #rezervacia; JS v assets/js/kalkulacka.js, CSS .rcalc v site.css

## Zmeny 24. 10.
- Replix živé demo (Make 8100320): funguje na akýkoľvek dopyt (tovar aj služby, napr. O2 paušály, stavebný materiál). AI vytvorí ilustračný cenník k dopytu (do 10 riadkov s množstevnými zľavami), priradí položky, chýbajúce množstvo doplní ako predpokladané; Make počíta zľavy, súčty a DPH (pri paušáloch „/ mesiac“). E-mail obsahuje odpoveď zákazníkovi, ponuku, podmienky dodania a použitý cenník s upozornením, že ceny sú ilustračné. Otestované 24. 10. (paušály O2, stavebný materiál).
- Text pri demo formulári: dopyt sa dá prepísať na čokoľvek, ceny sú ilustračné.

## Zmeny 24. 10. večer – právny a prístupnostný audit
- Nové stránky: `podmienky-pouzivania.html` (prevádzkovateľ, SOI, podmienky ukážok #ukazky, AI, autorské práva) a `cookies.html` (web bez cookies, len nevyhnutný local storage pri formulároch); `ochrana-osobnych-udajov.html` prepísaná podľa reálnych tokov v Make (OpenAI len pri ukážkach, hash e-mailu, outreach konateľov, doby uchovania, prenos do USA)
- Pätička: odkazy Ochrana OÚ · Podmienky používania · Cookies; „Živnostenský register Okresného úradu Bratislava“, „Neplatiteľ DPH“. CHÝBA: ulica miesta podnikania a číslo živnostenského registra (§ 4 zák. 22/2004) – doplniť od Daniela
- Odhad auta: pole Telefón odstránené (minimalizácia), formulár posiela skrytý `telefon=nezadany`, lebo filter v Make 8027094 vyžaduje existenciu telefónu – pri najbližšej úprave scenára filter zjednodušiť a hidden pole zmazať
- Texty pri formulároch = informácia o spracúvaní (nie súhlas, právny základ je žiadosť/zmluva)
- Kontrast: `--smoke` #9A9A9A → #8A8A8A, nový `--line` #8A8A8A pre okraje polí, volieb, dní a slotov (WCAG 1.4.11)
- fx.js: opona pri prechode stránok už nepoužíva sessionStorage (document.referrer) → web bez neprípustného úložiska
- Neoverené tvrdenia upravené: „Príklad z praxe“ → „Ilustračný príklad“, hint kalkulačky, AI Act veta, „najviac dopytov“, „väčšinou“, „Beží na vašich účtoch“, Nehnuteľnosti.sk v mockupe → „Realitný portál“
- SEO (24. 10.): Google ešte ukazoval starý Lead Radar → pridané robots.txt, sitemap.xml (pri novej stránke doplniť), canonical + og:url na každej stránke (build.py `{{url}}`), favicon 192×192 a apple-touch-icon (Google vyžaduje násobok 48 px), JSON-LD WebSite + Organization na úvode. Daniel musí overiť doménu v Google Search Console, odoslať sitemap a požiadať o indexovanie.

## Zmeny 25. 10. – SEO a viditeľnosť v AI vyhľadávačoch
- Google mal zaindexovaný len starý Lead Radar → web overený v Google Search Console (vlastníctvo https://aivalm.com/, súbor `google4816212a357776b3.html` v koreni – NEMAZAŤ; Bing: `BingSiteAuth.xml` – NEMAZAŤ), odoslaná sitemap
- Kľúčové slová (z Google návrhov a výsledkov vyhľadávania, Keyword Planner zatiaľ bez účtu):
  - úvod: AI automatizácia pre firmy, AI riešenia pre firmy, AI agentúra Slovensko, zavedenie AI do firmy
  - Replix: AI cenové ponuky, automatické cenové ponuky, automatizácia cenových ponúk, dopyty z e-mailu, veľkoobchody a distribútori
  - hlasový agent: AI hlasový agent/asistent pre realitné kancelárie a maklérov
  - odhad: AI odhad ceny auta a nehnuteľnosti, online odhad, autobazáre a realitky
- Nové title a meta popisy, H1/H2 s kľúčovými slovami (úvod: „AI automatizácia, ktorá vybaví…“, „AI riešenia pre firmy“, „Ako zavedieme AI do vašej firmy“)
- `brandname` riadok nad H1 aj na hlasovom agentovi a odhade ceny
- Sekcia #otazky „Časté otázky“ (komponent `.faq`, `<details>`) na 4 stránkach + FAQPage schema; Service schema na produktoch; Organization/ProfessionalService schema na úvode
- `llms.txt` v koreni – stručný popis firmy a produktov pre AI asistentov (ChatGPT, Claude, Perplexity)

## Zmeny 27. 10. – web iba o Replixe (jedna stránka)
- Rozhodnutie Daniela: AIVALM robí len Replix. Hlasový agent a odhad ceny zrušené z webu.
- `index.html` = celá stránka o Replixe: hero so **živou ukážkou priamo v hero** (výber odvetvia, ukážkový dopyt sa sám napíše, návštevník doplní e-mail → kroky s časovačom → ponuka sa vykreslí na stránke, tlačidlo „Schváliť a odoslať“) → príbeh „Od dopytu po odoslanú ponuku“ → „Kto odpovie prvý“ → kalkulačka → Pre koho → Presné, bezpečné a pod kontrolou → Pilot 30 dní → Kto za tým stojí → Časté otázky → rezervácia
- Ponuka na webe: **pilot 30 dní na 1–2 obchodníkoch, cena podľa objemu, dohodnutá vopred** (žiadne „3 mesiace zadarmo“, žiadne počítadlo miest)
- Menu: logo + Spolupráca + „Dohodnúť stretnutie“; bez hamburgera
- Staré URL (`cenove-ponuky.html`, `hlasovy-agent.html`, `odhad-ceny.html`) = presmerovania na úvod s kotvou (generuje `tools/build.py`, REDIRECTS). Outreach e-maily odkazujú na cenove-ponuky.html, preto presmerovanie NEMAZAŤ.
- Rezervácia: namiesto výberu produktu pole „Koľko e-mailových dopytov vám príde za deň?“ (`dopyty`) + skryté `produkt=cenove-ponuky`; Make 8032300: téma „Replix“, dopyty v udalosti aj v upozornení Danielovi, potvrdenie klientovi hovorí o Replixe
- Make 8100320 (živé demo): WebhookRespond presunutý na koniec → vracia JSON s ponukou (`typ`, `id`, `pocet`, `suma`, `dph`, `riadky`, `odpoved`, `zhrnutie`, `podmienky`, `neznamych`, `podozrive`); odpoveď ~10–15 s. E-maily: odkazy na aivalm.com/#rezervacia a #ukazka, text o pilote 30 dní
- CSS prepísané nanovo (z 1262 na ~640 riadkov, bez mŕtvych štýlov), `odhad.js` zmazaný, `demo.js` nový
- Spolupráca: Replix + nová forma „Prepojenie systémov“ pre implementátorov ERP (Pohoda, Money, SAP)
- GDPR, podmienky, cookies, llms.txt, sitemap, schema.org upravené na Replix

## Zmeny 27. 10. večer
- Ponuka: „Prvé 3 firmy: prvý mesiac zadarmo“ (hero pilulka, #pilot, FAQ, podmienky, llms.txt, e-mail z ukážky, outreach agent + šablóny REFERRAL/ZAUJEM_KONATEL)
- Make 8100320: pri každej ukážke ide Danielovi e-mail „🔔 Replix demo“ (e-mail záujemcu, doména, o čo išlo, položky, suma, celý dopyt; Reply-To = záujemca)
- Tlačidlo „Vyskúšať na vlastnom dopyte“ (`data-demo-cue`): PC = okno ukážky krátko zosivie, bodky zelené natrvalo, bez scrollu a bez fokusu; mobil = glide k ukážke + zelené bodky
- build.py: cache-busting `?v=YYYYMMDDHHMM` na CSS/JS
- Make: 15 nepoužívaných scenárov vypnutých a presunutých do priečinka „Na zmazanie (nepoužívané)“ (Daniel ich zmaže sám)
- spolupraca.html prerobená na **Partnerský program**: hero + animovaný graf mesačného príjmu (`partner.js`), pre koho (6 typov partnerov), ideálna firma (ICP), 4 kroky, 2 modely (odporúčanie / spoločný predaj), prečo sa oplatí, formulár (polia typ, meno, email, telefon, firma, sprava → Make 8032260), FAQ. Percento podielu zámerne bez čísla – doplniť, keď ho Daniel určí.
- Sobota 31. 10.: prechod z Makeu na Google Apps Script (pripomienka v kalendári)

## Zmeny 27. 10. noc
- Google Search Console: vyžiadané indexovanie `/` a `/spolupraca.html`, znova odoslaná sitemap (5 stránok). Bing Webmaster: odoslaných 5 URL (vrátane 3 starých presmerovaní s noindex).
- Spolupráca: **Odporúčanie 20 %** (kontakt + dať vedieť riaditeľovi/majiteľovi, že sa ozveme), **Spoločný predaj 30 %** (aktívne zapojenie, napr. stretnutie). Veľké číslo v kartách (`.pmodel__pct`), hero, graf, kroky, FAQ.
- Návštevnosť: PostHog EU, projekt 323168 „AIVALM web“, **cookieless_mode always** (projekt: cookieless_server_hash_mode = 2, timezone Europe/Bratislava), autocapture vypnutý, bez nahrávania. `assets/js/stats.js` v hlavičke; meria iba na doméne aivalm.com. Udalosti: $pageview, $pageleave, klik_stretnutie (kde), klik_vyskusat_ukazku, klik_email, klik_telefon, klik_chcem_byt_partnerom, ukazka_odoslana, ukazka_ponuka_hotova (sekundy, poloziek), stretnutie_rezervovane (forma, dopyty), partner_formular_odoslany (typ). Žiadne hodnoty z formulárov. Vlastné návštevy: raz otvoriť `?ja=1` (localStorage `aivalm-ja`), zrušiť `?ja=0`.
- Ochrana OÚ + cookies: doplnená anonymná štatistika PostHog (oprávnený záujem, 12 mesiacov, EÚ).
- Logo: vlastný vektor ľalie `assets/img/fleur.svg` (nakreslený nanovo, tvar zhodný s pôvodným PNG); menu, opona a pätička používajú SVG; `fleur.png`, `favicon.png`, `favicon-192.png`, `apple-touch-icon.png` vyrendrované z SVG v rovnakých rozmeroch a odsadení.
