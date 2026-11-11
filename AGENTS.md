# DDD (Discagem Direta à Distância)

Public site for DDD, a boiler-room-style broadcast project in Brasília: event promotion and an archive of past sets (video, photo recap). Static HTML/CSS/JS, no build step. Site copy is in Portuguese.

Where: music / events / ddd, `~/Dev/music/events/ddd` (manifest row `ddd`, lead `ddd-lead`).

Read docs/ROADMAP.md first: goal, open tasks, path forward and decisions needed.

## Run and deploy
- Two live paths (which one is canonical is an open decision in the roadmap): GitHub Pages from `main` via `.github/workflows/pages.yml` (custom domain in `CNAME`), and the VPS Dokploy app at https://ddd.grooveops.dev, built from the `vps-deploy` branch with the nginx `Dockerfile`.
- `RUNTIME.md`: the Mac folder is an editing clone; never start a local stack.
- Verify a change: open `index.html` locally, then check the live URL after the deploy.
- Heavy research artifacts (`JacflxOZHbg.mp4`, `recordings/`, `screenshots/`, `firebase-debug.log`) are gitignored and local only.

## Design rules
- Effects must be real. When elements should dodge or react to content, compute it (text reflow, physics); never fake it with masks, opaque backgrounds or z-index layering.
- Check visual work at full resolution and zoom in on the detail in question before calling it done; small screenshots hide overlaps and visible masks.
- Background state: `assets/js/ascii-background.js` (moiré) and `assets/js/hero-shader.js` are the stable baseline. The floating ASCII DDD-logo experiment (2026-03, `pretext-bg.js` and `pretext-global.js`) is only on the `wip/2026-05-11-pre-travel` branch; its bar is the moiré's smooth organic motion, with three independent logo shapes whose characters scatter near content and reform in empty space.

## Lead
`ddd-lead` (Paperclip, reports to `product-chief`) leads this site: its goals, backlog, design quality and the verified live result. It keeps `docs/ROADMAP.md` current, delegates to the `ddd` workers, and reports results and real blockers. This file is its project brief.
