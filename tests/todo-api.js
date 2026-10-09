// Tests for the single-file Todo API (app.js).
//
// Usage:
//   node tests/todo-api.js <BASE_URL>
//   node tests/todo-api.js http://localhost:3000
//
// Requires Node 18+ (built-in fetch).

import { run, assert } from "./runner.js"

const BASE_URL = process.argv[2]?.replace(/\/$/, "")

if (!BASE_URL) {
  console.error("Usage: node tests/todo-api.js <BASE_URL>")
  process.exit(1)
}

const USER = "test-user-1"

async function json(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

const tests = {
  "GET /health returns ok": async (url) => {
    const { status, data } = await json("GET", "/health")
    assert(status === 200, `status 200 (got ${status})`)
    assert(data?.status === "ok", `body.status === "ok" (got ${data?.status})`)
  },

  "GET /env returns ENV_PROBE_VALUE key": async (url) => {
    const { status, data } = await json("GET", "/env")
    assert(status === 200, `status 200 (got ${status})`)
    assert(data?.key === "ENV_PROBE_VALUE", `key === ENV_PROBE_VALUE (got ${data?.key})`)
    // value may be null if not injected — that's ok, we just verify the route works
    assert("value" in (data ?? {}), `response has 'value' field`)
  },

  "POST /users/:userId/todos creates a todo": async (url) => {
    const { status, data } = await json("POST", `/users/${USER}/todos`, {
      title: "buy milk",
    })
    assert(status === 201, `status 201 (got ${status})`)
    assert(typeof data?.id === "string", `response has string id (got ${typeof data?.id})`)
    assert(data?.title === "buy milk", `title matches (got ${data?.title})`)
    assert(data?.completed === false, `completed defaults to false (got ${data?.completed})`)
  },

  "POST /users/:userId/todos rejects empty title": async (url) => {
    const { status } = await json("POST", `/users/${USER}/todos`, { title: "  " })
    assert(status === 400, `status 400 for empty title (got ${status})`)
  },

  "POST /users/:userId/todos rejects non-boolean completed": async (url) => {
    const { status } = await json("POST", `/users/${USER}/todos`, {
      title: "valid title",
      completed: "yes",
    })
    assert(status === 400, `status 400 for string completed (got ${status})`)
  },

  "GET /users/:userId/todos lists todos": async (url) => {
    // Seed one todo first.
    await json("POST", `/users/${USER}/todos`, { title: "list-seed" })

    const { status, data } = await json("GET", `/users/${USER}/todos`)
    assert(status === 200, `status 200 (got ${status})`)
    assert(Array.isArray(data), `response is an array`)
    assert(data.length >= 1, `at least one todo returned (got ${data.length})`)
  },

  "GET /users/:userId/todos/:todoId returns a single todo": async (url) => {
    const { data: created } = await json("POST", `/users/${USER}/todos`, {
      title: "single-fetch",
    })
    const { status, data } = await json("GET", `/users/${USER}/todos/${created.id}`)
    assert(status === 200, `status 200 (got ${status})`)
    assert(data?.id === created.id, `same id (got ${data?.id})`)
    assert(data?.title === "single-fetch", `title matches`)
  },

  "GET /users/:userId/todos/:todoId 404 for bad id": async (url) => {
    const { status } = await json("GET", `/users/${USER}/todos/000000000000000000000000`)
    assert(status === 404, `status 404 for missing todo (got ${status})`)
  },

  "PUT /users/:userId/todos/:todoId updates title and completed": async (url) => {
    const { data: created } = await json("POST", `/users/${USER}/todos`, {
      title: "before update",
    })
    const { status, data } = await json("PUT", `/users/${USER}/todos/${created.id}`, {
      title: "after update",
      completed: true,
    })
    assert(status === 200, `status 200 (got ${status})`)
    assert(data?.title === "after update", `title updated (got ${data?.title})`)
    assert(data?.completed === true, `completed updated (got ${data?.completed})`)
  },

  "PUT /users/:userId/todos/:todoId 400 if no fields provided": async (url) => {
    const { data: created } = await json("POST", `/users/${USER}/todos`, {
      title: "put-no-fields",
    })
    const { status } = await json("PUT", `/users/${USER}/todos/${created.id}`, {})
    assert(status === 400, `status 400 when no fields (got ${status})`)
  },

  "DELETE /users/:userId/todos/:todoId deletes a todo": async (url) => {
    const { data: created } = await json("POST", `/users/${USER}/todos`, {
      title: "to-delete",
    })
    const { status: delStatus } = await json(
      "DELETE",
      `/users/${USER}/todos/${created.id}`
    )
    assert(delStatus === 200, `delete status 200 (got ${delStatus})`)

    const { status: getStatus } = await json(
      "GET",
      `/users/${USER}/todos/${created.id}`
    )
    assert(getStatus === 404, `todo is gone after delete (got ${getStatus})`)
  },

  "DELETE /users/:userId/todos/:todoId 404 for missing todo": async (url) => {
    const { status } = await json(
      "DELETE",
      `/users/${USER}/todos/000000000000000000000000`
    )
    assert(status === 404, `status 404 for missing todo (got ${status})`)
  },

  "Todos are isolated per user": async (url) => {
    const otherUser = "test-user-2"
    const { data: todo } = await json("POST", `/users/${USER}/todos`, {
      title: "user-isolated",
    })
    const { data: otherList } = await json("GET", `/users/${otherUser}/todos`)
    const found = Array.isArray(otherList) && otherList.some((t) => t.id === todo.id)
    assert(!found, `user-2 cannot see user-1's todos`)
  },
}

run(tests, BASE_URL)
