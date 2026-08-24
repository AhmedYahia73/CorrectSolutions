"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCertificate = exports.updateCertificate = exports.getCertificateById = exports.getAllCertificates = exports.createCertificate = exports.updateCertificateSchema = exports.createCertificateSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const handleImages_1 = require("../../utils/handleImages");
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
// ==========================================
// 🚀 Controllers
// ==========================================
// Create
const createCertificate = async (req, res, next) => {
    try {
        const { company_name, certificate_name, date, images } = req.body;
        const id = (0, uuid_1.v4)();
        const frontUrl = process.env.FRONT_URL || "http://localhost:3000/";
        const qrText = `${frontUrl}/certificate/${id}`;
        // Generate QR Code as base64
        const qrBase64 = await qrcode_1.default.toDataURL(qrText);
        // Save QR Image
        const qrSaved = await (0, handleImages_1.saveBase64Image)(req, qrBase64, "certificates/qrs");
        // Save Images
        const savedImagesPaths = [];
        for (const imgBase64 of images) {
            const savedImg = await (0, handleImages_1.saveBase64Image)(req, imgBase64, "certificates/images");
            savedImagesPaths.push(savedImg.relativePath); // Save relative path
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
        const records = await db_1.db.select().from(schema_1.certificate).orderBy((0, drizzle_orm_1.desc)(schema_1.certificate.createdAt));
        const baseUrl = `${req.protocol}://${req.get("host")}/`;
        const result = records.map(record => ({
            ...record,
            qr_url: `${baseUrl}${record.qr}`,
            images_urls: record.images.map(img => `${baseUrl}${img}`)
        }));
        return (0, response_1.SuccessResponse)(res, result, 200);
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
        const result = {
            ...record,
            qr_url: `${baseUrl}${record.qr}`,
            images_urls: record.images.map(img => `${baseUrl}${img}`)
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
            // First delete old images
            if (existingRecord.images && Array.isArray(existingRecord.images)) {
                for (const imgPath of existingRecord.images) {
                    try {
                        await (0, deleteImage_1.deletePhotoFromServer)(imgPath);
                    }
                    catch (e) { }
                }
            }
            // Save new ones
            const savedImagesPaths = [];
            for (const imgBase64 of images) {
                const savedImg = await (0, handleImages_1.saveBase64Image)(req, imgBase64, "certificates/images");
                savedImagesPaths.push(savedImg.relativePath);
            }
            updateData.images = savedImagesPaths;
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
