"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBase64Image = saveBase64Image;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid"); // لتوليد أسماء فريدة
async function saveBase64Image(req, base64, folder) {
    let mimeType = "image/png";
    let ext = "png";
    let base64Data = base64;
    const commaIdx = base64.indexOf(",");
    if (commaIdx !== -1) {
        const header = base64.slice(0, commaIdx);
        base64Data = base64.slice(commaIdx + 1);
        const match = header.match(/data:([^;]+)/);
        if (match) {
            mimeType = match[1];
            ext = mimeType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "png";
        }
    }
    else if (!base64 || base64.length < 10) {
        throw new Error("Invalid base64 format");
    }
    const buffer = Buffer.from(base64Data, "base64");
    // استخدام UUID لتجنب تكرار الأسماء
    const fileName = `${(0, uuid_1.v4)()}.${ext}`;
    const uploadsDir = path_1.default.join(__dirname, "../..", "uploads", folder);
    await promises_1.default.mkdir(uploadsDir, { recursive: true });
    const filePath = path_1.default.join(uploadsDir, fileName);
    await promises_1.default.writeFile(filePath, buffer);
    // إرجاع المسار النسبي والـ URL
    const relativePath = `uploads/${folder}/${fileName}`;
    const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
    return { url: imageUrl, relativePath };
}
