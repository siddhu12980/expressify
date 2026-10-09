# Test Setup

## MongoDB (for apps that need it)

```bash
# Start
docker compose -f docker-compose.mongo.yml up -d

# Stop (keeps data)
docker compose -f docker-compose.mongo.yml down

# Stop + wipe data
docker compose -f docker-compose.mongo.yml down -v
```

**Connection URL:** `mongodb://localhost:27017/todo-test`

Inject as env var in the mini-vercel dashboard: key `MONGODB_URL`, value above.

---

## Running tests

```bash
# Pass the deployed app's URL (check the port in Prisma Studio or worker logs)
node --input-type=module tests/todo-api.js http://localhost:<PORT>
```

---

## Adding tests for a new app

1. Create `tests/<app-name>.js`
2. Import from the runner:
   ```js
   import { run, assert } from "./runner.js"
   ```
3. Define a `tests` object — keys are test names, values are `async (baseUrl) => {}` functions
4. Call `run(tests, BASE_URL)` at the bottom
5. Run with `node --input-type=module tests/<app-name>.js http://localhost:<PORT>`

---

## Test files

| File | App | What it covers |
|---|---|---|
| `todo-api.js` | Single-file Express + Mongoose todo app | CRUD, validation, user isolation, env probe |
