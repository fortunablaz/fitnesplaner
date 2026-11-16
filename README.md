# Dnevnik Treningov

Spletni app (PWA) za generiranje in beleženje treningov za vadeče. Deluje na telefonu in računalniku, tudi brez interneta.

## Objava na GitHub Pages
1. Na github.com klikni **New repository**, ime npr. `treningi`, izberi **Public** in klikni **Create repository**.
2. Klikni **uploading an existing file** in povleci vse datoteke iz te mape (tudi mapo `icons`). Nato klikni **Commit changes**.
3. Odpri **Settings → Pages**. Pod *Branch* izberi `main` in `/ (root)` ter klikni **Save**.
4. Čez 1–2 minuti je app dostopen na `https://TVOJE-IME.github.io/treningi/`.

## Prvi zagon
V appu odpri zavihek **Več → Uvozi datoteko** in izberi `stranke-uvoz.json`.

⚠ Datoteke `stranke-uvoz.json` in izvozov **NE nalagaj na GitHub**. Vsebujejo osebne in zdravstvene podatke strank.

## Posodobitev appa
Zamenjaj spremenjene datoteke v repozitoriju. V `sw.js` povečaj `VERSION` (npr. `dt-v2`), da telefoni naložijo novo verzijo.
