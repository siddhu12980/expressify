"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = require("node:path");
const envDir = process.cwd();
const envFile = process.env.DOTENV_CONFIG_PATH ?? (0, node_path_1.resolve)(envDir, ".env");
dotenv_1.default.config({ path: envFile });
dotenv_1.default.config({ path: (0, node_path_1.resolve)(envDir, ".env.local"), override: true });
const port = Number(process.env.PORT ?? 8080);
const auth_routes_1 = require("./features/auth/auth.routes");
const projects_routes_1 = require("./features/projects/projects.routes");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)());
const apiRouter = express_1.default.Router();
apiRouter.get("/health", (_req, res) => {
    res.json({ ok: true });
});
apiRouter.use("/auth", auth_routes_1.authRouter);
apiRouter.use("/projects", projects_routes_1.projectsRouter);
exports.app.use("/api", apiRouter);
exports.app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
