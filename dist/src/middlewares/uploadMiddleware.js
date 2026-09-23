"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCertificateImagesMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const BadRequest_1 = require("../Errors/BadRequest");
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new BadRequest_1.BadRequest("Only image files are allowed"));
    }
};
exports.uploadCertificateImagesMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB per file
        files: 20, // up to 20 files per batch
    },
    fileFilter,
}).array("images", 20);
