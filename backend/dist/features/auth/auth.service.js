"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const prisma_1 = require("../../lib/prisma");
const jsonwebtoken_1 = require("jsonwebtoken");
const password_1 = require("../../lib/password");
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
async function registerUser(input) {
    const email = normalizeEmail(input.email);
    const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash: await (0, password_1.hashPassword)(input.password),
        },
    });
    return {
        token: (0, jsonwebtoken_1.sign)({ sub: user.id, email: user.email }, process.env.JWT_SECRET),
        user: { id: user.id, email: user.email },
    };
}
async function loginUser(input) {
    const email = normalizeEmail(input.email);
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const passwordMatches = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
    if (!passwordMatches) {
        throw new Error("Invalid credentials");
    }
    return {
        token: (0, jsonwebtoken_1.sign)({ sub: user.id, email: user.email }, process.env.JWT_SECRET),
        user: { id: user.id, email: user.email },
    };
}
