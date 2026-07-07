import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { resolve } from "node:path"

const envDir = process.cwd()
const envFile = process.env.DOTENV_CONFIG_PATH ?? resolve(envDir, ".env")

dotenv.config({ path: envFile })
dotenv.config({ path: resolve(envDir, ".env.local"), override: true })
const port = Number(process.env.PORT ?? 8080)

import { authRouter } from "./features/auth/auth.routes"
import { projectsRouter } from "./features/projects/projects.routes"
import { githubRouter, githubWebhookRouter } from "./features/github/github.routes"



export const app = express()

app.use("/api/github/webhooks", express.raw({ type: "application/json" }), githubWebhookRouter)
app.use(express.json())
app.use(cors())

const apiRouter = express.Router()

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true })
})
apiRouter.use("/auth", authRouter)
apiRouter.use("/github", githubRouter)
apiRouter.use("/projects", projectsRouter)

app.use("/api", apiRouter)


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
