---
goal: Give DDD (Discagem Direta à Distância), a Brasília boiler-room-style broadcast project, a public site that promotes events and archives past sets.
owner: operator
lead: ddd-lead
status: draft
next: "Retire the duplicate VPS nginx deploy at ddd.grooveops.dev, keeping GitHub Pages at ddd.in.net."
decisions_needed: []
blocked_by: []
---

## Open tasks

- [ ] Confirm canonical deploy path (GH Pages vs VPS) and remove/disable the other [T-001]
- [ ] Clean up local-only heavy artifacts (1.4GB `JacflxOZHbg.mp4`, `firebase-debug.log`, `recordings/`, `screenshots/`) — already gitignored, safe to delete from disk if not needed for future clip work #autonomous-safe [T-002]
- [ ] Decide fate of `.agents/skills/youtube-clipper` (includes a `.venv/`) — keep as a working tool or archive out of the repo #autonomous-safe [T-003]
- [ ] If another DDD event is planned, restore homepage to pre-event/announcement state; otherwise document "archive mode" explicitly in README [T-004]
- [ ] Review `boiler-room/index.html` — appears to be a secondary/legacy page; confirm it's still linked or remove #autonomous-safe [T-005]

## Path forward

Site currently sits in a stable post-event archive state (DDD 001 concluded), serving video/photo recap content plus a text-scramble-enhanced homepage.
The main open question is operator-level: is this a recurring series (needs "next event" mode restored) or a one-off archive (needs no further content work, just occasional link/asset maintenance).
Deploy plumbing has redundancy (GH Pages + VPS) worth collapsing to one path per the elder-brain deploy standard.
No code-quality or security issues surfaced during this pass — the repo is small, static, and low-risk.
Until the operator decides on the event's future, treat this as maintenance-only.

## Decisions (2026-11-17)

- Canonical site: GitHub Pages serving the official domain ddd.in.net, registered at Hostinger (operator, 2026-11-17). The VPS nginx deploy at ddd.grooveops.dev is a second copy to retire. Checked 2026-11-17: ddd.in.net resolves to GitHub Pages and returns 200.
- Next event: none scheduled yet. The site stays in its current post-event state for now (operator, 2026-11-17).
