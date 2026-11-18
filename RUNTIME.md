# Runtime: Hostinger at ddd.in.net

The official DDD site is **https://ddd.in.net**, served by Hostinger (the shared "Unlimited" plan that also hosts dsrptvrec.com) behind the Hostinger CDN; `www.ddd.in.net` serves the same site.

- **Deploy:** `.github/workflows/deploy-hostinger.yml` runs on every push to `main`. It stages the public files (no agent/ops docs), rsyncs them over SSH to `domains/ddd.in.net/public_html` with the `HOSTINGER_SSH_KEY` secret and the pinned `HOSTINGER_KNOWN_HOSTS` variable, then checks that the live `index.html` matches the commit.
- **Ship a change:** commit to a branch, open a PR to `main`, merge. The workflow deploys and verifies.
- **DNS, SSL and email** for `ddd.in.net` live in Hostinger (hPanel). Apex ALIAS and `www` CNAME point to the Hostinger CDN; the Let's Encrypt certificate covers both names.

## Retired copies

- **GitHub Pages** served `ddd.in.net` until 2026-11-17 and was removed on 2026-11-18 (#9).
- **VPS:** until 2026-11-17 a copy ran on the elder-brain VPS as Dokploy application `app-reboot-online-alarm-rjbizi` (built from the `vps-deploy` branch, served at `ddd.grooveops.dev`). It is stopped with autodeploy off; its definition is kept in Dokploy, so it can be started again, but nothing serves from it.
