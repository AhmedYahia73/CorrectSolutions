import { Request, Response, NextFunction } from "express";
import { db } from "../../models/db";
import { certificate } from "../../models/schema"; 
import { eq, desc } from 'drizzle-orm';
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { z } from "zod";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

export const createCertificateSchema = z.object({
  body: z.object({
    company_name: z.string().min(1, "Company name is required"),
    certificate_name: z.string().min(1, "Certificate name is required"),
    date: z.string().min(1, "Date is required"),
    images: z.array(z.string()).min(1, "At least one image is required")
  })
});

export const updateCertificateSchema = z.object({
  body: z.object({
    company_name: z.string().optional(),
    certificate_name: z.string().optional(),
    date: z.string().optional(),
    images: z.array(z.string()).optional()
  })
});

// ==========================================
// 🚀 Controllers
// ==========================================

// Create
export const createCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_name, certificate_name, date, images } = req.body;

    const id = uuidv4();
    const frontUrl = process.env.FRONT_URL || "http://localhost:3000/";
    const qrText = `${frontUrl}/certificate/${id}`;
    
    // Generate QR Code as base64
    const qrBase64 = await QRCode.toDataURL(qrText);
    
    // Save QR Image
    const qrSaved = await saveBase64Image(req, qrBase64, "certificates/qrs");

    // Save Images
    const savedImagesPaths: string[] = [];
    for (const imgBase64 of images) {
      const savedImg = await saveBase64Image(req, imgBase64, "certificates/images");
      savedImagesPaths.push(savedImg.relativePath); // Save relative path
    }

    // Insert into DB
    const newDate = new Date(date);
    await db.insert(certificate).values({
      id,
      company_name,
      certificate_name,
      date: newDate,
      qr: qrSaved.relativePath,
      images: savedImagesPaths
    });

    return SuccessResponse(res, { message: "Certificate created successfully", id }, 201);
  } catch (error) {
    next(error);
  }
};

// Get All
export const getAllCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];
    if (search) {
      const searchPattern = `%${search}%`;
      const { or, like } = require('drizzle-orm');
      whereConditions.push(
        or(
          like(certificate.company_name, searchPattern),
          like(certificate.certificate_name, searchPattern)
        )
      );
    }

    let query = db.select().from(certificate).orderBy(desc(certificate.createdAt)).$dynamic();
    let countQuery = db.select({ total: require('drizzle-orm').count() }).from(certificate).$dynamic();

    if (whereConditions.length > 0) {
      const { and } = require('drizzle-orm');
      query = query.where(and(...whereConditions));
      countQuery = countQuery.where(and(...whereConditions));
    }

    const [records, [{ total: totalCount }]] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery
    ]);
    
    const baseUrl = `${req.protocol}://${req.get("host")}/`;
    
    const result = records.map(record => {
      let parsedImages = [];
      try {
        parsedImages = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
      } catch(e) {
        parsedImages = [];
      }
      return {
        ...record,
        qr_url: `${baseUrl}${record.qr}`,
        images_urls: Array.isArray(parsedImages) ? parsedImages.map(img => `${baseUrl}${img}`) : []
      };
    });

    return SuccessResponse(res, {
      certificates: result,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, 200);
  } catch (error) {
    next(error);
  }
};

// Get By ID
export const getCertificateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const [record] = await db.select().from(certificate).where(eq(certificate.id, id));
    
    if (!record) {
      throw new NotFound("Certificate not found");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/`;
    let parsedImages = [];
    try {
      parsedImages = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
    } catch(e) {
      parsedImages = [];
    }

    const result = {
      ...record,
      qr_url: `${baseUrl}${record.qr}`,
      images_urls: Array.isArray(parsedImages) ? parsedImages.map(img => `${baseUrl}${img}`) : []
    };

    return SuccessResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

// Update
export const updateCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { company_name, certificate_name, date, images } = req.body;

    const [existingRecord] = await db.select().from(certificate).where(eq(certificate.id, id));
    if (!existingRecord) {
      throw new NotFound("Certificate not found");
    }

    const updateData: any = {};
    
    if (company_name) updateData.company_name = company_name;
    if (certificate_name) updateData.certificate_name = certificate_name;
    if (date) updateData.date = new Date(date);
    
    if (images && images.length > 0) {
      // First delete old images
      if (existingRecord.images && Array.isArray(existingRecord.images)) {
        for (const imgPath of existingRecord.images) {
          try {
             await deletePhotoFromServer(imgPath);
          } catch(e) {}
        }
      }

      // Save new ones
      const savedImagesPaths: string[] = [];
      for (const imgBase64 of images) {
        const savedImg = await saveBase64Image(req, imgBase64, "certificates/images");
        savedImagesPaths.push(savedImg.relativePath);
      }
      updateData.images = savedImagesPaths;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(certificate).set(updateData).where(eq(certificate.id, id));
    }

    return SuccessResponse(res, { message: "Certificate updated successfully" }, 200);
  } catch (error) {
    next(error);
  }
};

// Delete
export const deleteCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const [existingRecord] = await db.select().from(certificate).where(eq(certificate.id, id));
    
    if (!existingRecord) {
      throw new NotFound("Certificate not found");
    }

    // Delete QR
    if (existingRecord.qr) {
      try {
        await deletePhotoFromServer(existingRecord.qr);
      } catch (e) {}
    }

    // Delete Images
    if (existingRecord.images && Array.isArray(existingRecord.images)) {
      for (const imgPath of existingRecord.images) {
        try {
          await deletePhotoFromServer(imgPath);
        } catch (e) {}
      }
    }

    await db.delete(certificate).where(eq(certificate.id, id));

    return SuccessResponse(res, { message: "Certificate deleted successfully" }, 200);
  } catch (error) {
    next(error);
  }
};