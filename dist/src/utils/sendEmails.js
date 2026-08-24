"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Transporter configuration
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: `"Kidzero" <${process.env.EMAIL_USER}>`, // ← هنا التعديل
            to: to,
            subject: subject,
            text: text,
            html: `<div style="font-family: Arial; direction: rtl; padding: 20px;">
        <h2>كود التحقق</h2>
        <p style="font-size: 24px; font-weight: bold;">${text}</p>
      </div>`,
        });
        return info;
    }
    catch (err) {
        console.error("Error:", err.message);
        throw err;
    }
};
exports.sendEmail = sendEmail;
