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

import { and, ne } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { BadRequest } from "../../Errors/BadRequest";

export async function getProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const userProfile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userProfile[0]) {
    throw new NotFound("User not found");
  }

  return SuccessResponse(res, { user: userProfile[0] }, 200);
}

export async function updateProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const { name, email, phone, password } = req.body;
  
  const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existingUser[0]) {
    throw new NotFound("User not found");
  }

  if (email && email !== existingUser[0].email) {
    const duplicateEmail = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, userId)))
      .limit(1);
    if (duplicateEmail[0]) {
      throw new BadRequest("Email already exists");
    }
  }

  if (phone && phone !== existingUser[0].phone) {
    const duplicatePhone = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, phone), ne(users.id, userId)))
      .limit(1);
    if (duplicatePhone[0]) {
      throw new BadRequest("Phone already exists");
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
  
  const updatedUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  const tokenPayload = {
    id: updatedUser[0].id,
    role: updatedUser[0].role as "admin" | "leader" | "sales" | "user",
    email: updatedUser[0].email,
    name: updatedUser[0].name,
    phone: updatedUser[0].phone,
  };
  const token = generateUserToken(tokenPayload);

  return SuccessResponse(
    res,
    {
      message: "Profile updated successfully",
      token,
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        phone: updatedUser[0].phone,
        role: updatedUser[0].role,
      },
    },
    200
  );
}