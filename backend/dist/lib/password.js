"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
async function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64));
    return `${salt}:${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) {
        return false;
    }
    const derivedKey = (await scrypt(password, salt, 64));
    const storedBuffer = Buffer.from(hash, "hex");
    if (storedBuffer.length !== derivedKey.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(storedBuffer, derivedKey);
}
