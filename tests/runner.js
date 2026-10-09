// Shared test runner utilities.
// Each test file calls `run(tests, BASE_URL)` with a map of test functions.

const RESET = "\x1b[0m"
const GREEN = "\x1b[32m"
const RED = "\x1b[31m"
const DIM = "\x1b[2m"
const BOLD = "\x1b[1m"

export function pass(label) {
  console.log(`  ${GREEN}✓${RESET} ${label}`)
}

export function fail(label, detail) {
  console.log(`  ${RED}✗${RESET} ${label}`)
  if (detail) console.log(`    ${DIM}${detail}${RESET}`)
}

export function assert(condition, label, detail = "") {
  if (condition) {
    pass(label)
    return true
  }
  fail(label, detail)
  return false
}

export async function run(tests, baseUrl) {
  const names = Object.keys(tests)
  let passed = 0
  let failed = 0

  console.log(`\n${BOLD}Running ${names.length} tests against ${baseUrl}${RESET}\n`)

  for (const name of names) {
    console.log(`${DIM}▸ ${name}${RESET}`)
    try {
      await tests[name](baseUrl)
      passed++
    } catch (err) {
      fail("unexpected error", err.message)
      failed++
    }
    console.log()
  }

  console.log(`${BOLD}Results: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ""}${failed} failed${RESET}\n`)
  if (failed > 0) process.exit(1)
}
