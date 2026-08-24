"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = __importDefault(require("./admin"));
const auth_1 = __importDefault(require("./auth"));
const certificate_1 = __importDefault(require("./certificate"));
const settings_1 = __importDefault(require("./settings"));
const router = (0, express_1.Router)();
router.use("/admin", admin_1.default);
router.use("/auth", auth_1.default);
router.use("/certificate", certificate_1.default);
router.use("/settings", settings_1.default);
exports.default = router;
