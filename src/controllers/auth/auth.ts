// src/controllers/auth/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { users } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateUserToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { Permission } from "../../types/custom";
 

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  // 1) جلب الأدمن بالإيميل
  const admin = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!admin[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 2) التحقق من الباسورد
  const match = await bcrypt.compare(password, admin[0].password);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 5) إنشاء التوكن
  const tokenPayload = {
    id: admin[0].id,
    role: admin[0].role as "admin" | "leader" | "sales" | "user",
    email: admin[0].email,
    name: admin[0].name,
    phone: admin[0].phone,
  };

  const token = generateUserToken(tokenPayload);

  // 6) الرد
  return SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      user: {
        id: admin[0].id,
        name: admin[0].name,
        email: admin[0].email,
        phone: admin[0].phone,
        role: admin[0].role, 
      },
    },
    200
  );
}
export async function hash_password(req: Request, res: Response) {
  const { password } = req.body;
  
  // 6) الرد
  return SuccessResponse(
    res,
    {
      password: await bcrypt.hash(password, 10), 
    },
    200
  );
}
 