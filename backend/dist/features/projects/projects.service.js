"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.listProjects = listProjects;
const prisma_1 = require("../../lib/prisma");
function slugify(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
async function buildUniqueSlug(name) {
    const baseSlug = slugify(name) || "project";
    let slug = baseSlug;
    let count = 1;
    while (await prisma_1.prisma.project.findUnique({ where: { slug } })) {
        count += 1;
        slug = `${baseSlug}-${count}`;
    }
    return slug;
}
async function createProject(input) {
    const slug = await buildUniqueSlug(input.name);
    return prisma_1.prisma.project.create({
        data: {
            userId: input.userId,
            name: input.name.trim(),
            slug,
            repoOwner: input.repoOwner.trim(),
            repoName: input.repoName.trim(),
            repoUrl: input.repoUrl.trim(),
            branch: input.branch.trim(),
        },
    });
}
async function listProjects(userId) {
    return prisma_1.prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            deployments: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });
}
