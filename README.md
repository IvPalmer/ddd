# DDD — Discagem Direta à Distância

Static site scaffold for a boiler room–style broadcast project in Brasília.

## Edit content
- `index.html`: replace placeholder copy (Sobre, Próxima transmissão, etc.)
- `assets/logo/logo.svg`: swap with real logo
- `assets/images/`: add hero/gallery images
- `styles.css`: update brand colors in `:root`
- `script.js`: set `data-datetime` in `#countdown` or remove it

## Links
- Live site (after first deploy): https://ivpalmer.github.io/ddd/
- Repo: https://github.com/IvPalmer/ddd

## Deploy
The canonical deploy is the VPS (Dokploy + nginx) at https://ddd.grooveops.dev.

GitHub Pages is a mirror: `.github/workflows/pages.yml` still deploys every push
to `main` so the `CNAME` domain (`ddd.in.net`) stays current. Moving `ddd.in.net`
to the VPS needs DNS access and is a separate decision.
