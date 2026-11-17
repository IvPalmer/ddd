# Runtime: GitHub Pages at ddd.in.net

The official DDD site is **https://ddd.in.net**. The domain is registered at Hostinger and points to GitHub Pages; `www.ddd.in.net` redirects to it.

- **Deploy:** `.github/workflows/pages.yml` publishes `main` to GitHub Pages on every push. The `CNAME` file holds `ddd.in.net`.
- **Ship a change:** commit to a branch, open a PR to `main`, merge. Pages redeploys on its own.
- **DNS and email** for `ddd.in.net` live in Hostinger (hPanel). The site only needs the GitHub Pages A records and the `www` CNAME there.

## Retired: the VPS copy

Until 2026-11-17 a second copy ran on the elder-brain VPS as Dokploy application `app-reboot-online-alarm-rjbizi` (built from the `vps-deploy` branch, served at `ddd.grooveops.dev`). The operator made GitHub Pages on `ddd.in.net` canonical, so that application was stopped with autodeploy off. Its definition is kept in Dokploy, so it can be started again, but nothing serves from it.
