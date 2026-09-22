"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWatermarkAndSave = applyWatermarkAndSave;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const WATERMARK_URL = "https://certificatebcknd.correctsolution.net/uploads/1.png";
const LOCAL_WATERMARK_PATH = path_1.default.join(__dirname, "../assets/watermark.png");
let cachedWatermarkBase64 = null;
let cachedWatermarkAspect = 927 / 269;
/**
 * Retrieves the watermark image base64, cached in memory to avoid repeated I/O or network requests.
 */
async function getWatermarkBase64() {
    if (cachedWatermarkBase64) {
        return cachedWatermarkBase64;
    }
    // 1. Try reading from local assets
    try {
        if (fs_1.default.existsSync(LOCAL_WATERMARK_PATH)) {
            const buf = await promises_1.default.readFile(LOCAL_WATERMARK_PATH);
            const meta = await (0, sharp_1.default)(buf).metadata();
            if (meta.width && meta.height) {
                cachedWatermarkAspect = meta.width / meta.height;
            }
            cachedWatermarkBase64 = buf.toString("base64");
            return cachedWatermarkBase64;
        }
    }
    catch (err) {
        console.warn("Could not read local watermark asset, falling back to network fetch:", err);
    }
    // 2. Fallback: fetch from remote URL and cache locally
    try {
        const res = await fetch(WATERMARK_URL);
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        try {
            await promises_1.default.mkdir(path_1.default.dirname(LOCAL_WATERMARK_PATH), { recursive: true });
            await promises_1.default.writeFile(LOCAL_WATERMARK_PATH, buf);
        }
        catch { }
        const meta = await (0, sharp_1.default)(buf).metadata();
        if (meta.width && meta.height) {
            cachedWatermarkAspect = meta.width / meta.height;
        }
        cachedWatermarkBase64 = buf.toString("base64");
        return cachedWatermarkBase64;
    }
    catch (fetchErr) {
        console.error("Failed to load watermark:", fetchErr);
        throw new Error("Unable to load watermark image");
    }
}
/**
 * Applies a diagonal watermark (from top-left to bottom-right with 0.4 opacity)
 * onto a base64 image and saves it to disk at maximum speed.
 */
async function applyWatermarkAndSave(req, base64, folder) {
    // Fast base64 parsing without regex backtracking
    let mimeType = "image/jpeg";
    let ext = "jpg";
    let base64Data = base64;
    const commaIdx = base64.indexOf(",");
    if (commaIdx !== -1) {
        const header = base64.slice(0, commaIdx);
        base64Data = base64.slice(commaIdx + 1);
        const match = header.match(/data:([^;]+)/);
        if (match) {
            mimeType = match[1];
            const parsedExt = mimeType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "");
            if (parsedExt) {
                ext = parsedExt === "jpeg" ? "jpg" : parsedExt;
            }
        }
    }
    const inputBuffer = Buffer.from(base64Data, "base64");
    const wmBase64 = await getWatermarkBase64();
    // Load into Sharp and retrieve dimensions
    const image = (0, sharp_1.default)(inputBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;
    // Diagonal length and angle from top-left (0,0) to bottom-right (width, height)
    const diagonal = Math.hypot(width, height);
    const angle = (Math.atan2(height, width) * 180) / Math.PI;
    // Watermark spans ~90% along the diagonal
    const targetWmWidth = Math.round(diagonal * 0.90);
    const targetWmHeight = Math.round(targetWmWidth / cachedWatermarkAspect);
    // SVG overlay rotated along diagonal with opacity 0.4
    const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${width / 2}, ${height / 2}) rotate(${angle})">
        <image 
          href="data:image/png;base64,${wmBase64}" 
          x="${-targetWmWidth / 2}" 
          y="${-targetWmHeight / 2}" 
          width="${targetWmWidth}" 
          height="${targetWmHeight}" 
          opacity="0.4"
        />
      </g>
    </svg>
  `);
    const uploadsDir = path_1.default.join(__dirname, "../..", "uploads", folder);
    await promises_1.default.mkdir(uploadsDir, { recursive: true });
    const fileName = `${(0, uuid_1.v4)()}.${ext}`;
    const filePath = path_1.default.join(uploadsDir, fileName);
    // Composite watermark onto image and write directly to file
    let pipeline = image.composite([{ input: svgOverlay, top: 0, left: 0 }]);
    if (ext === "png") {
        pipeline = pipeline.png({ compressionLevel: 6 });
    }
    else if (ext === "webp") {
        pipeline = pipeline.webp({ quality: 85 });
    }
    else {
        pipeline = pipeline.jpeg({ quality: 85 });
    }
    await pipeline.toFile(filePath);
    const relativePath = `uploads/${folder}/${fileName}`;
    const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
    return { url: imageUrl, relativePath };
}
