# Neon Coast Cover Studio

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline cover-art studio that turns your own photos and a caption into multi-panel, GTA-style cover art
and exports it as a PNG in the three common post sizes. It is an entry in the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on make.fun. Everything runs in
the browser from static files — your photos are read on your own machine and never uploaded anywhere.

## What it does

- **Panel posters, not photo filters.** Twelve layouts across the three sizes: a nine-panel poster grid
  with the title block in the middle, a top-banner masthead, a side-stack title column and a full-bleed
  cover with inset panels. Every panel is inked like printed poster art — keyline border, halftone dots,
  film grain and a vignette.
- **Any photo, placed your way.** Load several photos, click a panel and drop a photo into it, drag to
  reposition and scroll to zoom each panel's crop, or spread one photo across the whole grid.
- **A pop-out hero.** One photo becomes a cut-out that spills across the panel borders with a white
  keyline and drop shadow: pick the backdrop colour to key out (with tolerance, feather and a despill
  pass), or take the one-click ink silhouette that works on any photo.
- **Retro-chrome lettering.** The headline is drawn as striped retro chrome with a cyan neon bleed, the
  subtitle as a glowing neon script, set in a halftone title block with a five-star heat meter. A badge
  ribbon, role tags and a sunset callout panel finish the poster.
- **Ten colour grades.** Vice Sunset, Neon Night, Golden Hour, Dusk Purple, Rain Storm, Noir Ink, Candy
  Pop, Desert Heat, Ocean Breeze and Midnight Chrome — each a gradient map with its own split tone,
  halftone, grain and vignette weights.
- **Fast to a PNG.** Export the current size, or all three sizes (1080 × 1080, 1080 × 1350, 1920 × 1080)
  in one click. Film grain and vignette strength sliders finish the print look, and undo and redo cover
  every change.

The lettering fonts are Anton and Pacifico, vendored under `app/fonts/` with their SIL Open Font License
texts. The sample photos under `app/samples/` were made with an image model and are free to use. All of
the art, lettering and code is original to this studio — no Rockstar Games logo, artwork or fonts.

## Run it

Serve `app/` with any static file server, or from the repository root:

```sh
node serve.ts   # then open http://localhost:8080
```

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
