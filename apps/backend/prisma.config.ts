import dotenv from "dotenv"
import { resolve } from "node:path"
import { defineConfig, env } from "prisma/config"

const envDir = process.cwd()
const envFile = process.env.DOTENV_CONFIG_PATH ?? resolve(envDir, ".env")

dotenv.config({ path: envFile })
dotenv.config({ path: resolve(envDir, ".env.local"), override: true })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
