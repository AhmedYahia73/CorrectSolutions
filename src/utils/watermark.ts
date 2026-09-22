import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const WATERMARK_URL = "https://certificatebcknd.correctsolution.net/uploads/1.png";
const LOCAL_WATERMARK_PATH = path.join(__dirname, "../assets/watermark.png");

let cachedWatermarkBase64: string | null = null;
let cachedWatermarkAspect: number = 927 / 269;

/**
 * Retrieves the watermark image base64, cached in memory to avoid repeated I/O or network requests.
 */
async function getWatermarkBase64(): Promise<string> {
  if (cachedWatermarkBase64) {
    return cachedWatermarkBase64;
  }

  // 1. Try reading from local assets
  try {
    if (fsSync.existsSync(LOCAL_WATERMARK_PATH)) {
      const buf = await fs.readFile(LOCAL_WATERMARK_PATH);
      const meta = await sharp(buf).metadata();
      if (meta.width && meta.height) {
        cachedWatermarkAspect = meta.width / meta.height;
      }
      cachedWatermarkBase64 = buf.toString("base64");
      return cachedWatermarkBase64;
    }
  } catch (err) {
    console.warn("Could not read local watermark asset, falling back to network fetch:", err);
  }

  // 2. Fallback: fetch from remote URL and cache locally
  try {
    const res = await fetch(WATERMARK_URL);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    try {
      await fs.mkdir(path.dirname(LOCAL_WATERMARK_PATH), { recursive: true });
      await fs.writeFile(LOCAL_WATERMARK_PATH, buf);
    } catch {}

    const meta = await sharp(buf).metadata();
    if (meta.width && meta.height) {
      cachedWatermarkAspect = meta.width / meta.height;
    }
    cachedWatermarkBase64 = buf.toString("base64");
    return cachedWatermarkBase64;
  } catch (fetchErr) {
    console.error("Failed to load watermark:", fetchErr);
    throw new Error("Unable to load watermark image");
  }
}

/**
 * Applies a diagonal watermark (from top-left to bottom-right with 0.4 opacity)
 * onto a base64 image and saves it to disk at maximum speed.
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
  const wmBase64 = await getWatermarkBase64();

  // Load into Sharp and retrieve dimensions
  const image = sharp(inputBuffer);
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

  const uploadsDir = path.join(__dirname, "../..", "uploads", folder);
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${uuidv4()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  // Composite watermark onto image and write directly to file
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
}
