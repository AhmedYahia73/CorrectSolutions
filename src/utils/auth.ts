// src/utils/auth.ts

import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import { TokenPayload } from "../types/custom";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET as string;

// ✅ للـ Admin (موظف بصلاحيات إدارية كاملة)
export const generateAdminToken = (data: {
  id: string;
  name: string;
  email: string;
  phone: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "admin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// ✅ للـ Leader (قائد فريق أو مشرف على التارجت)
export const generateLeaderToken = (data: {
  id: string;
  name: string;
  email: string;
  phone: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "leader",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// ✅ للـ Sales (مندوب المبيعات الميداني - المسؤول عن الزيارات)
export const generateSalesToken = (data: {
  id: string;
  name: string;
  email: string;
  phone: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "sales",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// ✅ دالة عامة لتوليد التوكن بناءً على الدور القادم ديناميكياً من قاعدة البيانات
export const generateUserToken = (data: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "leader" | "sales" | "user";
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// 🛡️ التحقق من صحة الـ Token وفك تشفيره
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};