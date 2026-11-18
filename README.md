# DDD — Discagem Direta à Distância

Static site scaffold for a boiler room–style broadcast project in Brasília.

## Edit content
- `index.html`: replace placeholder copy (Sobre, Próxima transmissão, etc.)
- `assets/logo/logo.svg`: swap with real logo
- `assets/images/`: add hero/gallery images
- `styles.css`: update brand colors in `:root`
- `script.js`: set `data-datetime` in `#countdown` or remove it

## Links
- Live site: https://ddd.in.net
- Repo: https://github.com/IvPalmer/ddd

## Deploy
A push to `main` deploys to Hostinger with `.github/workflows/deploy-hostinger.yml`
(rsync over SSH to `domains/ddd.in.net/public_html`, then a live check). See `RUNTIME.md`.
