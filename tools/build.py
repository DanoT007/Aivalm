#!/usr/bin/env python3
"""Assemble the static site: src/pages/*.html + src/partials -> repo root.

Page front-matter (first lines, HTML comment):
<!--
title: ...
desc: ...
nav: spolupraca | (empty)
scripts: stories.js, demo.js
-->
Markers inside the page body: <!--@booking-->

Old URLs (products that no longer exist, the former Replix sub-page) are written as tiny
redirect pages to the home page, keeping the #anchor, so links in sent e-mails, QR codes
and search results still land somewhere useful. Edit REDIRECTS below, never by hand.

Run: python3 tools/build.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
part = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}

# old page -> where it goes on the new one-page site
REDIRECTS = {
    "cenove-ponuky.html": "",          # Replix moved to the home page (outreach e-mails link here)
    "hlasovy-agent.html": "",          # product discontinued 27. 10. 2026
    "odhad-ceny.html": "",             # product discontinued 27. 10. 2026
}

for page in sorted((SRC / "pages").glob("*.html")):
    raw = page.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--(.*?)-->\s*", raw, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        raw = raw[m.end():]
    url = "https://aivalm.com/" + ("" if page.name == "index.html" else page.name)
    home = "" if page.name == "index.html" else "index.html"   # in-page anchors live on the home page
    head = (part["head"].replace("{{title}}", meta.get("title", "AIVALM"))
            .replace("{{desc}}", meta.get("desc", "")).replace("{{url}}", url).replace("{{home}}", home))
    nav = meta.get("nav", "")
    if nav:
        head = head.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
    scripts = "\n".join(
        f'<script src="assets/js/{s.strip()}" defer></script>' for s in meta.get("scripts", "").split(",") if s.strip()
    )
    base = ('<script src="assets/vendor/gsap.min.js" defer></script>\n'
            '<script src="assets/vendor/ScrollTrigger.min.js" defer></script>\n'
            '<script src="assets/vendor/lenis.min.js" defer></script>\n')
    if "stories.js" in meta.get("scripts", ""):
        base += '<script src="assets/vendor/DrawSVGPlugin.min.js" defer></script>\n'
    scripts = base + '<script src="assets/js/fx.js" defer></script>\n' + scripts
    foot = part["footer"].replace("{{scripts}}", scripts).replace("{{home}}", home)
    body = raw.replace("<!--@booking-->", part["booking"])
    out = head + body + foot
    if 'id="rezervacia"' not in out:  # page without booking: send CTAs to the home page booking
        out = out.replace('href="#rezervacia"', 'href="index.html#rezervacia"')
    (ROOT / page.name).write_text(out, encoding="utf-8")
    print("built", page.name)

STUB = """<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Replix | AIVALM</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://aivalm.com/{target}">
<meta http-equiv="refresh" content="0; url=/{target}">
<script>location.replace('/{target}' + location.search + location.hash)</script>
</head>
<body style="font-family:system-ui,sans-serif;padding:40px">
<p>Stránka sa presunula. <a href="/{target}">Pokračovať na aivalm.com</a></p>
</body>
</html>
"""
for name, target in REDIRECTS.items():
    (ROOT / name).write_text(STUB.format(target=target), encoding="utf-8")
    print("redirect", name, "->", "/" + target)
