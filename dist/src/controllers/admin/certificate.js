"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCertificate = exports.updateCertificate = exports.getCertificateById = exports.getAllCertificates = exports.createCertificate = exports.uploadCertificateImages = exports.updateCertificateSchema = exports.createCertificateSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest");
const handleImages_1 = require("../../utils/handleImages");
const watermark_1 = require("../../utils/watermark");
const deleteImage_1 = require("../../utils/deleteImage");
const zod_1 = require("zod");
const qrcode_1 = __importDefault(require("qrcode"));
const uuid_1 = require("uuid");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
exports.createCertificateSchema = zod_1.z.object({
    body: zod_1.z.object({
        company_name: zod_1.z.string().min(1, "Company name is required"),
        certificate_name: zod_1.z.string().min(1, "Certificate name is required"),
        date: zod_1.z.string().min(1, "Date is required"),
        images: zod_1.z.array(zod_1.z.string()).min(1, "At least one image is required")
    })
});
exports.updateCertificateSchema = zod_1.z.object({
    body: zod_1.z.object({
        company_name: zod_1.z.string().optional(),
        certificate_name: zod_1.z.string().optional(),
        date: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional()
    })
});
// Helper to determine if an image string is raw base64 or already an uploaded path
function isBase64Image(str) {
    return str.startsWith("data:image/") || str.length > 500;
}
// Clean url/path to relative path 'uploads/...'
function cleanRelativePath(str) {
    const uploadsIndex = str.indexOf("uploads/");
    return uploadsIndex !== -1 ? str.slice(uploadsIndex) : str;
}
// ==========================================
// 🚀 Controllers
// ==========================================
// Upload Images in Batches (Multipart)
const uploadCertificateImages = async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new BadRequest_1.BadRequest("No images uploaded");
        }
        // Process files in controlled batches of 3-4 to keep memory and CPU low
        const savedResults = await (0, watermark_1.processInBatches)(files, 4, async (file) => {
            return (0, watermark_1.applyWatermarkBufferAndSave)(req, file.buffer, file.mimetype, "certificates/images");
        });
        return (0, response_1.SuccessResponse)(res, {
            message: "Images uploaded and watermarked successfully",
            paths: savedResults.map(r => r.relativePath),
            urls: savedResults.map(r => r.url)
        }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.uploadCertificateImages = uploadCertificateImages;
// Create
const createCertificate = async (req, res, next) => {
    try {
        const { company_name, certificate_name, date, images } = req.body;
        const id = (0, uuid_1.v4)();
        const frontUrl = process.env.FRONT_URL || "http://localhost:3000/";
        const qrText = `${frontUrl}/certificate/${id}`;
        // Generate QR Code as base64
        const qrBase64 = await qrcode_1.default.toDataURL(qrText);
        const qrSaved = await (0, handleImages_1.saveBase64Image)(req, qrBase64, "certificates/qrs");
        // Process images: support both already-uploaded relative paths and base64 strings
        const savedImagesPaths = new Array(images.length);
        const base64Items = [];
        images.forEach((img, idx) => {
            if (isBase64Image(img)) {
                base64Items.push({ index: idx, base64: img });
            }
            else {
                savedImagesPaths[idx] = cleanRelativePath(img);
            }
        });
        // If any base64 images were provided, process them in controlled batches
        if (base64Items.length > 0) {
            const processed = await (0, watermark_1.processInBatches)(base64Items, 4, async (item) => {
                const saved = await (0, watermark_1.applyWatermarkAndSave)(req, item.base64, "certificates/images");
                return { index: item.index, relativePath: saved.relativePath };
            });
            for (const resItem of processed) {
                savedImagesPaths[resItem.index] = resItem.relativePath;
            }
        }
        // Insert into DB
        const newDate = new Date(date);
        await db_1.db.insert(schema_1.certificate).values({
            id,
            company_name,
            certificate_name,
            date: newDate,
            qr: qrSaved.relativePath,
            images: savedImagesPaths
        });
        return (0, response_1.SuccessResponse)(res, { message: "Certificate created successfully", id }, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createCertificate = createCertificate;
// Get All
const getAllCertificates = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;
        let whereConditions = [];
        if (search) {
            const searchPattern = `%${search}%`;
            const { or, like } = require('drizzle-orm');
            whereConditions.push(or(like(schema_1.certificate.company_name, searchPattern), like(schema_1.certificate.certificate_name, searchPattern)));
        }
        let query = db_1.db.select().from(schema_1.certificate).orderBy((0, drizzle_orm_1.desc)(schema_1.certificate.createdAt)).$dynamic();
        let countQuery = db_1.db.select({ total: require('drizzle-orm').count() }).from(schema_1.certificate).$dynamic();
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
            }
            catch (e) {
                parsedImages = [];
            }
            return {
                ...record,
                qr_url: `${baseUrl}${record.qr}`,
                images_urls: Array.isArray(parsedImages) ? parsedImages.map(img => `${baseUrl}${img}`) : []
            };
        });
        return (0, response_1.SuccessResponse)(res, {
            certificates: result,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllCertificates = getAllCertificates;
// Get By ID
const getCertificateById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [record] = await db_1.db.select().from(schema_1.certificate).where((0, drizzle_orm_1.eq)(schema_1.certificate.id, id));
        if (!record) {
            throw new NotFound_1.NotFound("Certificate not found");
        }
        const baseUrl = `${req.protocol}://${req.get("host")}/`;
        let parsedImages = [];
        try {
            parsedImages = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
        }
        catch (e) {
            parsedImages = [];
        }
        const result = {
            ...record,
            qr_url: `${baseUrl}${record.qr}`,
            images_urls: Array.isArray(parsedImages) ? parsedImages.map(img => `${baseUrl}${img}`) : []
        };
        return (0, response_1.SuccessResponse)(res, result, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getCertificateById = getCertificateById;
// Update
const updateCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { company_name, certificate_name, date, images } = req.body;
        const [existingRecord] = await db_1.db.select().from(schema_1.certificate).where((0, drizzle_orm_1.eq)(schema_1.certificate.id, id));
        if (!existingRecord) {
            throw new NotFound_1.NotFound("Certificate not found");
        }
        const updateData = {};
        if (company_name)
            updateData.company_name = company_name;
        if (certificate_name)
            updateData.certificate_name = certificate_name;
        if (date)
            updateData.date = new Date(date);
        if (images && images.length > 0) {
            // Process images: support already-uploaded relative paths and base64 strings
            const finalImagesPaths = new Array(images.length);
            const base64Items = [];
            images.forEach((img, idx) => {
                if (isBase64Image(img)) {
                    base64Items.push({ index: idx, base64: img });
                }
                else {
                    finalImagesPaths[idx] = cleanRelativePath(img);
                }
            });
            if (base64Items.length > 0) {
                const processed = await (0, watermark_1.processInBatches)(base64Items, 4, async (item) => {
                    const saved = await (0, watermark_1.applyWatermarkAndSave)(req, item.base64, "certificates/images");
                    return { index: item.index, relativePath: saved.relativePath };
                });
                for (const resItem of processed) {
                    finalImagesPaths[resItem.index] = resItem.relativePath;
                }
            }
            // Determine which old images were actually removed, and delete only those
            let oldImages = [];
            if (Array.isArray(existingRecord.images)) {
                oldImages = existingRecord.images;
            }
            else if (typeof existingRecord.images === "string") {
                try {
                    oldImages = JSON.parse(existingRecord.images);
                }
                catch (e) {
                    oldImages = [];
                }
            }
            const newPathsSet = new Set(finalImagesPaths);
            const removedImages = oldImages.filter((oldImg) => !newPathsSet.has(oldImg));
            if (removedImages.length > 0) {
                await Promise.all(removedImages.map((imgPath) => (0, deleteImage_1.deletePhotoFromServer)(imgPath).catch(() => { })));
            }
            updateData.images = finalImagesPaths;
        }
        if (Object.keys(updateData).length > 0) {
            await db_1.db.update(schema_1.certificate).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.certificate.id, id));
        }
        return (0, response_1.SuccessResponse)(res, { message: "Certificate updated successfully" }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCertificate = updateCertificate;
// Delete
const deleteCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existingRecord] = await db_1.db.select().from(schema_1.certificate).where((0, drizzle_orm_1.eq)(schema_1.certificate.id, id));
        if (!existingRecord) {
            throw new NotFound_1.NotFound("Certificate not found");
        }
        // Delete QR
        if (existingRecord.qr) {
            try {
                await (0, deleteImage_1.deletePhotoFromServer)(existingRecord.qr);
            }
            catch (e) { }
        }
        // Delete Images
        if (existingRecord.images && Array.isArray(existingRecord.images)) {
            for (const imgPath of existingRecord.images) {
                try {
                    await (0, deleteImage_1.deletePhotoFromServer)(imgPath);
                }
                catch (e) { }
            }
        }
        await db_1.db.delete(schema_1.certificate).where((0, drizzle_orm_1.eq)(schema_1.certificate.id, id));
        return (0, response_1.SuccessResponse)(res, { message: "Certificate deleted successfully" }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCertificate = deleteCertificate;
