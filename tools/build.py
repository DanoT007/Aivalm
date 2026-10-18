#!/usr/bin/env python3
"""Assemble the static site: src/pages/*.html + src/partials -> repo root.

Page front-matter (first lines, HTML comment):
<!--
title: ...
desc: ...
nav: hlasovy | odhad | email | spolupraca | (empty)
produkt: hlasovy-agent | odhad-ceny | cenove-ponuky | neviem
scripts: stories.js, demo.js
-->
Markers inside the page body: <!--@booking-->
Run: python3 tools/build.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
part = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}

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
    head = part["head"].replace("{{title}}", meta.get("title", "AIVALM")).replace("{{desc}}", meta.get("desc", ""))
    nav = meta.get("nav", "")
    if nav:
        head = head.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
    booking = part["booking"]
    prod = meta.get("produkt", "neviem")
    for v in ["hlasovy-agent", "odhad-ceny", "cenove-ponuky", "neviem"]:
        booking = booking.replace("{{sel:%s}}" % v, " selected" if v == prod else "")
    scripts = "\n".join(
        f'<script src="assets/js/{s.strip()}" defer></script>' for s in meta.get("scripts", "").split(",") if s.strip()
    )
    base = ('<script src="assets/vendor/gsap.min.js" defer></script>\n'
            '<script src="assets/vendor/ScrollTrigger.min.js" defer></script>\n'
            '<script src="assets/vendor/lenis.min.js" defer></script>\n')
    if "stories.js" in meta.get("scripts", ""):
        base += '<script src="assets/vendor/DrawSVGPlugin.min.js" defer></script>\n'
    scripts = base + '<script src="assets/js/fx.js" defer></script>\n' + scripts
    foot = part["footer"].replace("{{scripts}}", scripts)
    body = raw.replace("<!--@booking-->", booking)
    out = head + body + foot
    (ROOT / page.name).write_text(out, encoding="utf-8")
    print("built", page.name)
