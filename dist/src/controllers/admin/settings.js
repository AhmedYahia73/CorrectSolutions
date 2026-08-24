"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = exports.updateSettingsSchema = void 0;
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
exports.updateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        brand_name: zod_1.z.string().optional(),
        logo: zod_1.z.string().optional(),
    })
});
// ==========================================
// 🚀 Controllers
// ==========================================
const getSettings = async (req, res, next) => {
    try {
        const records = await db_1.db.select().from(schema_1.settings).limit(1);
        const baseUrl = `${req.protocol}://${req.get("host")}/`;
        if (records.length === 0) {
            // Create first record
            const id = (0, uuid_1.v4)();
            const frontUrl = process.env.FRONT_URL || "http://localhost:3000/";
            // Remove trailing slash if exists to avoid double slash if not intended, but we just use string concat as user asked
            const qrText = `${frontUrl}/allcompanies`.replace(/([^:]\/)\/+/g, "$1"); // cleanup double slashes except http://
            const qrBase64 = await qrcode_1.default.toDataURL(qrText);
            const qrSaved = await (0, handleImages_1.saveBase64Image)(req, qrBase64, "settings/qrs");
            await db_1.db.insert(schema_1.settings).values({
                id,
                qr: qrSaved.relativePath,
                brand_name: null,
                logo: null
            });
            const [newRecord] = await db_1.db.select().from(schema_1.settings).limit(1);
            const result = {
                ...newRecord,
                qr_url: newRecord.qr ? `${baseUrl}${newRecord.qr}` : null,
                logo_url: newRecord.logo ? `${baseUrl}${newRecord.logo}` : null
            };
            return (0, response_1.SuccessResponse)(res, result, 200);
        }
        const record = records[0];
        const result = {
            ...record,
            qr_url: record.qr ? `${baseUrl}${record.qr}` : null,
            logo_url: record.logo ? `${baseUrl}${record.logo}` : null
        };
        return (0, response_1.SuccessResponse)(res, result, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const { brand_name, logo } = req.body;
        const records = await db_1.db.select().from(schema_1.settings).limit(1);
        if (records.length === 0) {
            throw new NotFound_1.NotFound("Settings not found");
        }
        const existingRecord = records[0];
        const updateData = {};
        if (brand_name !== undefined) {
            updateData.brand_name = brand_name;
        }
        if (logo) {
            // Delete old logo
            if (existingRecord.logo) {
                try {
                    await (0, deleteImage_1.deletePhotoFromServer)(existingRecord.logo);
                }
                catch (e) { }
            }
            const savedLogo = await (0, handleImages_1.saveBase64Image)(req, logo, "settings/logo");
            updateData.logo = savedLogo.relativePath;
        }
        if (Object.keys(updateData).length > 0) {
            await db_1.db.update(schema_1.settings).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.settings.id, existingRecord.id));
        }
        return (0, response_1.SuccessResponse)(res, { message: "Settings updated successfully" }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
