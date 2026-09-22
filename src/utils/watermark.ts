import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { saveBase64Image } from "./handleImages";

const LOCAL_WATERMARK_PATHS = [
  path.join(__dirname, "../assets/watermark.png"),
  path.join(process.cwd(), "dist/src/assets/watermark.png"),
  path.join(process.cwd(), "src/assets/watermark.png"),
  path.join(process.cwd(), "uploads/1.png"),
];

const WATERMARK_URL = "https://certificatebcknd.correctsolution.net/uploads/1.png";

let cachedWatermarkBuffer: Buffer | null = null;
let cachedWatermarkBase64: string | null = null;
const WATERMARK_ASPECT = 927 / 269;

/**
 * Safely load Sharp if installed.
 */
function getSharp(): any {
  try {
    return require("sharp");
  } catch {
    return null;
  }
}

/**
 * Safely load the bundled standalone pure-JS watermark processor.
 */
function getBundledProcessor(): any {
  const tryPaths = [
    path.join(__dirname, "../vendor/bundledWatermark.js"),
    path.join(process.cwd(), "dist/src/vendor/bundledWatermark.js"),
    path.join(process.cwd(), "src/vendor/bundledWatermark.js"),
  ];
  for (const p of tryPaths) {
    try {
      if (fsSync.existsSync(p)) {
        return require(p);
      }
    } catch {}
  }
  return null;
}

/**
 * Retrieves the watermark image buffer, cached in memory.
 */
async function getWatermarkBuffer(): Promise<Buffer> {
  if (cachedWatermarkBuffer) {
    return cachedWatermarkBuffer;
  }

  // 1. Try reading from known local paths
  for (const p of LOCAL_WATERMARK_PATHS) {
    try {
      if (fsSync.existsSync(p)) {
        const buf = await fs.readFile(p);
        cachedWatermarkBuffer = buf;
        cachedWatermarkBase64 = buf.toString("base64");
        return cachedWatermarkBuffer;
      }
    } catch {}
  }

  // 2. Fallback: fetch from remote URL
  try {
    const res = await fetch(WATERMARK_URL);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    cachedWatermarkBuffer = buf;
    cachedWatermarkBase64 = buf.toString("base64");
    return cachedWatermarkBuffer;
  } catch (err) {
    console.error("Failed to load watermark:", err);
    throw new Error("Unable to load watermark image");
  }
}

/**
 * Applies a diagonal watermark (from top-left to bottom-right with 0.4 opacity)
 * onto a base64 image and saves it to disk.
 * Uses Sharp if available; otherwise uses bundled standalone pure-JS processor.
 */
export async function applyWatermarkAndSave(
  req: Request,
  base64: string,
  folder: string
): Promise<{ url: string; relativePath: string }> {
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
  const uploadsDir = path.join(process.cwd(), "uploads", folder);
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${uuidv4()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  const sharp = getSharp();
  if (sharp) {
    try {
      const wmBuffer = await getWatermarkBuffer();
      const wmBase64 = cachedWatermarkBase64 || wmBuffer.toString("base64");

      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      const width = metadata.width || 1200;
      const height = metadata.height || 800;

      const diagonal = Math.hypot(width, height);
      const angle = (Math.atan2(height, width) * 180) / Math.PI;

      const targetWmWidth = Math.round(diagonal * 0.85);
      const targetWmHeight = Math.round(targetWmWidth / WATERMARK_ASPECT);

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

      let pipeline = image.composite([{ input: svgOverlay, top: 0, left: 0 }]);
      if (ext === "png") {
        pipeline = pipeline.png({ compressionLevel: 6 });
      } else if (ext === "webp") {
        pipeline = pipeline.webp({ quality: 85 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85 });
      }

      await pipeline.toFile(filePath);

      const relativePath = `uploads/${folder}/${fileName}`;
      const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
      return { url: imageUrl, relativePath };
    } catch (sharpErr) {
      console.warn("Sharp watermarking failed, trying bundled processor:", sharpErr);
    }
  }

  // Fallback: Bundled pure-JS processor (runs everywhere with ZERO external dependencies)
  const bundled = getBundledProcessor();
  if (bundled && bundled.processWatermarkWithJimp) {
    try {
      const wmBuffer = await getWatermarkBuffer();
      const outputBuffer = await bundled.processWatermarkWithJimp(inputBuffer, wmBuffer, mimeType);
      await fs.writeFile(filePath, outputBuffer);

      const relativePath = `uploads/${folder}/${fileName}`;
      const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
      return { url: imageUrl, relativePath };
    } catch (bundleErr) {
      console.warn("Bundled watermarking failed, falling back to raw save:", bundleErr);
    }
  }

  // Last-resort fallback: Save raw image
  return saveBase64Image(req, base64, folder);
}
