import path from "path";
import fs from "fs/promises";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid"; // لتوليد أسماء فريدة

export async function saveBase64Image(
  req: Request,
  base64: string,
  folder: string
): Promise<{ url: string; relativePath: string }> {
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
  } else if (!base64 || base64.length < 10) {
    throw new Error("Invalid base64 format");
  }

  const buffer = Buffer.from(base64Data, "base64");

  // استخدام UUID لتجنب تكرار الأسماء
  const fileName = `${uuidv4()}.${ext}`;
  const uploadsDir = path.join(__dirname, "../..", "uploads", folder);

  await fs.mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  // إرجاع المسار النسبي والـ URL
  const relativePath = `uploads/${folder}/${fileName}`;
  const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;

  return { url: imageUrl, relativePath };
}
