import { Request, Response, NextFunction } from "express";
import { db } from "../../models/db";
import { settings } from "../../models/schema"; 
import { eq } from 'drizzle-orm';
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { z } from "zod";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

export const updateSettingsSchema = z.object({
  body: z.object({
    brand_name: z.string().optional(),
    logo: z.string().optional(),
  })
});

// ==========================================
// 🚀 Controllers
// ==========================================

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await db.select().from(settings).limit(1);
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    if (records.length === 0) {
      // Create first record
      const id = uuidv4();
      const frontUrl = process.env.FRONT_URL || "http://localhost:3000/";
      // Remove trailing slash if exists to avoid double slash if not intended, but we just use string concat as user asked
      const qrText = `${frontUrl}/allcompanies`.replace(/([^:]\/)\/+/g, "$1"); // cleanup double slashes except http://
      
      const qrBase64 = await QRCode.toDataURL(qrText);
      const qrSaved = await saveBase64Image(req, qrBase64, "settings/qrs");

      await db.insert(settings).values({
        id,
        qr: qrSaved.relativePath,
        brand_name: null,
        logo: null
      });

      const [newRecord] = await db.select().from(settings).limit(1);

      const result = {
        ...newRecord,
        qr_url: newRecord.qr ? `${baseUrl}${newRecord.qr}` : null,
        logo_url: newRecord.logo ? `${baseUrl}${newRecord.logo}` : null
      };

      return SuccessResponse(res, result, 200);
    }

    const record = records[0];
    const result = {
      ...record,
      qr_url: record.qr ? `${baseUrl}${record.qr}` : null,
      logo_url: record.logo ? `${baseUrl}${record.logo}` : null
    };

    return SuccessResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brand_name, logo } = req.body;

    const records = await db.select().from(settings).limit(1);
    if (records.length === 0) {
      throw new NotFound("Settings not found");
    }

    const existingRecord = records[0];
    const updateData: any = {};

    if (brand_name !== undefined) {
      updateData.brand_name = brand_name;
    }

    if (logo) {
      // Delete old logo
      if (existingRecord.logo) {
        try {
          await deletePhotoFromServer(existingRecord.logo);
        } catch (e) {}
      }
      
      const savedLogo = await saveBase64Image(req, logo, "settings/logo");
      updateData.logo = savedLogo.relativePath;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(settings).set(updateData).where(eq(settings.id, existingRecord.id));
    }

    return SuccessResponse(res, { message: "Settings updated successfully" }, 200);
  } catch (error) {
    next(error);
  }
};