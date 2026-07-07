"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
exports.authRouter = (0, express_1.Router)();
function parseAuthBody(body) {
    const input = body;
    if (typeof input?.email !== "string" ||
        typeof input?.password !== "string" ||
        input.password.length < 6) {
        return null;
    }
    return {
        email: input.email,
        password: input.password,
    };
}
exports.authRouter.post("/signup", async (req, res) => {
    const input = parseAuthBody(req.body);
    if (!input) {
        return res
            .status(400)
            .json({ error: "Email and password are required. Password must be at least 6 characters." });
    }
    try {
        const result = await (0, auth_service_1.registerUser)(input);
        return res.status(201).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create account";
        return res.status(400).json({ error: message });
    }
});
exports.authRouter.post("/login", async (req, res) => {
    const input = parseAuthBody(req.body);
    if (!input) {
        return res.status(400).json({ error: "Email and password are required." });
    }
    try {
        const result = await (0, auth_service_1.loginUser)(input);
        return res.json(result);
    }
    catch {
        return res.status(401).json({ error: "Invalid credentials" });
    }
});
