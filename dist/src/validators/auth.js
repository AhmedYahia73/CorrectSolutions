"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.loginSchema = zod_1.default.object({
    body: zod_1.default.object({
        email: zod_1.default.string().email("Invalid email"),
        password: zod_1.default.string().min(6, "Password must be at leas 6 characters long"),
    }),
});
