"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const projects_service_1 = require("./projects.service");
exports.projectsRouter = (0, express_1.Router)();
exports.projectsRouter.use(auth_1.authMiddleware);
function parseCreateProjectBody(body) {
    const input = body;
    if (typeof input?.name !== "string" ||
        typeof input?.repoOwner !== "string" ||
        typeof input?.repoName !== "string" ||
        typeof input?.repoUrl !== "string" ||
        typeof input?.branch !== "string") {
        return null;
    }
    return {
        name: input.name,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        repoUrl: input.repoUrl,
        branch: input.branch,
    };
}
exports.projectsRouter.get("/", async (req, res) => {
    const authReq = req;
    const projects = await (0, projects_service_1.listProjects)(authReq.auth.userId);
    res.json({ projects });
});
exports.projectsRouter.post("/", async (req, res) => {
    const authReq = req;
    const input = parseCreateProjectBody(req.body);
    if (!input) {
        return res.status(400).json({
            error: "name, repoOwner, repoName, repoUrl, and branch are required.",
        });
    }
    const project = await (0, projects_service_1.createProject)({
        userId: authReq.auth.userId,
        ...input,
    });
    return res.status(201).json({ project });
});
