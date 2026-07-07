# Mini Vercel for Express — v0 PRD (Todo Format)

One-liner: Student-friendly deploy platform — GitHub → live Express URL.

Frontend is agent-built, not covered here. This is backend/infra scope only.

---

## 1. GitHub Import
- [ ] OAuth GitHub connect
- [ ] List user repos, let them pick one + branch
- [ ] Clone repo server-side (shallow clone, single branch)

## 2. Project Detection
- [ ] Check for `package.json`
- [ ] Confirm `express` in dependencies
- [ ] Read `start` script (or fallback: `node index.js` / `node server.js`)
- [ ] Reject if no Express detected → show clear error to user

> Note: don't try to be clever here. If detection fails, fail loud and early. Silent wrong guesses cause confusing downstream errors.

## 3. Env Variables
- [ ] UI form to add key-value pairs (frontend handles UI, you just need an API to store them)
- [ ] Store encrypted at rest (even basic AES is fine for v0)
- [ ] Inject as container env vars at runtime — never bake into image

## 4. Build (Docker Image)
- [ ] Auto-generate a Dockerfile if user repo doesn't have one
  - Base: `node:lts-slim`
  - `npm install` → copy → `npm start`
- [ ] Build image inside an isolated build context (see note)
- [ ] Tag image per project + deployment id (e.g. `project123:deploy_45`)
- [ ] Capture build logs (stdout/stderr) and store/stream them

> **Note — isolation during build:** Don't build directly on your host docker daemon if multiple users can trigger builds concurrently. Either:
> - Use a job queue (one build at a time per worker), or
> - Use rootless Docker / a build sandbox (e.g. `docker-in-docker` with resource limits, or buildkit with restricted privileges).
> Risk: malicious repo with a build script that tries to access host resources, hit other containers, or exhaust CPU/disk. Set hard limits: build timeout (e.g. 3 min), memory cap, no network egress beyond npm registry if possible.

## 5. Run Container
- [ ] Run with strict resource limits: `--memory`, `--cpus`, `--pids-limit`
- [ ] Assign internal port (container always listens on fixed port, e.g. 3000, mapped internally — don't trust user's `PORT` env blindly, inject it yourself)
- [ ] Auto-restart policy (`on-failure`, max retries — don't loop forever on crash)
- [ ] Track container health (running / crashed / OOM killed)

> **Note — in-app error handling:** You can't control what bugs the student's app has. What you *can* control:
> - Detect crash loop (container restarts >N times in M minutes) → mark deployment "failed", stop retrying, surface logs.
> - Capture exit code + last N lines of stdout/stderr on crash — this is the #1 debugging signal you must show the user.
> - Don't let one crashing container hang the whole build/deploy pipeline — isolate failures per deployment.

## 6. Domain Routing (Traefik)
- [ ] Traefik watches container labels for routing rules
- [ ] On deploy, attach labels: `project-slug.yourdomain.com` → container
- [ ] Wildcard DNS (`*.yourdomain.com` → your server IP) set up once at DNS level
- [ ] TLS: use Traefik + Let's Encrypt wildcard or per-subdomain cert (start with wildcard, simpler)

> **Note — domain routing gotchas:**
> - Subdomain slug must be unique + sanitized (no special chars, no collisions with reserved words like `www`, `api`, `admin`).
> - On redeploy, route should swap to new container with zero/minimal downtime (Traefik handles this if you update labels and let old container drain before killing).
> - Watch out for stale routes — if a container dies unexpectedly, Traefik may still show the old route until you clean it up. Add a reconciliation check (cron or on-deploy) that removes orphaned routes.

## 7. Logs + Deploy Status
- [ ] Stream container logs (docker logs -f equivalent) to frontend via WebSocket
- [ ] Persist last N lines even after container stops (for crash debugging)
- [ ] Deploy status states: `building → deploying → live / failed`
- [ ] Simple status API/webhook the frontend polls or subscribes to

---

## General Notes
- Keep one container per project, no orchestration logic beyond "stop old, start new."
- No need for a queue system at full scale — a simple in-memory or DB-backed job queue is enough for v0 traffic.
- Log every failure with enough context (which stage: detect / build / run / route) so debugging your own platform doesn't become guesswork.
- Resist scope creep — if something's not in the todo above, it's v1+.
