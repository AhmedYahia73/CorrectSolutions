import nodemailer from "nodemailer";

// Transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendEmail = async (to: string, subject: string, text: string) => {
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
  } catch (err: any) {
    console.error("Error:", err.message);
    throw err;
  }
};
