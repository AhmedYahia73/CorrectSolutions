// src/controllers/admin/adminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { users } from "../../models/schema"; 
import { SQL, and, or, eq, like, count, desc, ne } from 'drizzle-orm';
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { z } from "zod";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء مسؤول (Admin) جديد
export const createAdminSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(200, "Name cannot exceed 200 characters"),
    
    email: z.string({ required_error: "Email is required" })
      .email("Invalid email format")
      .max(100, "Email cannot exceed 100 characters"),
    
    phone: z.string({ required_error: "Phone is required" })
      .min(5, "Phone is too short")
      .max(20, "Phone cannot exceed 20 characters"),
    
    password: z.string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
       
  }),
});

// الـ Schema الخاص بتحديث مسؤول (Admin)
export const updateAdminSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid admin ID format"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").max(200).optional(),
    email: z.string().email("Invalid email format").max(100).optional(),
    phone: z.string().min(5).max(20).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

// الـ Schema للعمليات التي تتطلب المعرف ID فقط في الـ parameters
export const adminIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid admin ID format"),
  }),
});


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Admins

export const getAllAdmin = async (req: Request, res: Response) => {
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const offset = (page - 1) * limit;

    let whereConditions: SQL[] = [];

    // 1. الفلترة الأساسية: جلب المستخدمين الذين يمتلكون دور "admin" فقط
    whereConditions.push(eq(users.role, "admin"));

    // 2. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني للمشرفين
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push(
            or(
                like(users.name, searchPattern),
                like(users.phone, searchPattern),
                like(users.email, searchPattern)
            ) as SQL
        );
    }

    // 3. بناء استعلام البيانات الأساسي (Base Query)
    let query = db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            createdAt: users.createdAt
        })
        .from(users)
        .orderBy(desc(users.createdAt)) // ترتيب الأحدث أولاً
        .$dynamic();

    // 4. بناء استعلام الـ Count لحساب العدد الإجمالي متوافقاً مع فلاتر البحث
    let countQuery = db
        .select({ total: count() })
        .from(users)
        .$dynamic();

    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
        countQuery = countQuery.where(and(...whereConditions));
    }

    // 5. تنفيذ الاستعلامين بالتوازي (Parallel Execution) لتقليل زمن الاستجابة لأقل حد ممكن
    const [allAdmins, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);

    // 6. إرسال النتيجة مع معلومات الـ Pagination الكاملة
    SuccessResponse(res, { 
        admins: allAdmins,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};

// ✅ Get Admin By ID
export const getAdminById = async (req: Request, res: Response) => {
    const validated = await adminIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const admin = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
        })
        .from(users) 
        .where(and(eq(users.id, id), eq(users.role, "admin")))
        .limit(1);

    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }

    SuccessResponse(res, { admin: admin[0] }, 200);
};

// ✅ Create Admin
export const createAdmin = async (req: Request, res: Response) => {
    const validated = await createAdminSchema.parseAsync({ body: req.body });
    const { name, email, password, phone } = validated.body;
    
    // تحقق من عدم وجود مستخدم آخر بنفس الـ email أو الـ phone
    const existingAdmin = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.phone, phone)))
        .limit(1);

    if (existingAdmin[0]) {
        throw new BadRequest("Email or Phone already exists");
    } 

    // Hash الـ password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    await db.insert(users).values({
        name,
        email,
        phone, 
        password: hashedPassword, 
    });

    SuccessResponse(res, { message: "Admin created successfully" }, 201);
};

// ✅ Update Admin
export const updateAdmin = async (req: Request, res: Response) => {
    const validated = await updateAdminSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { name, email, password, phone } = validated.body;
  
    // تحقق من وجود الـ Admin
    const existingAdmin = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "admin")))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    // تحقق من الـ email لو تم تعديله ولم يكرر مع حساب آخر
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), ne(users.id, id)))
            .limit(1);

        if (duplicateEmail[0]) {
            throw new BadRequest("Email already exists");
        }
    } 

    // تحقق من الـ phone لو تم تعديله ولم يكرر مع حساب آخر
    if (phone && phone !== existingAdmin[0].phone) {
        const duplicatePhone = await db
            .select()
            .from(users)
            .where(and(eq(users.phone, phone), ne(users.id, id)))
            .limit(1);

        if (duplicatePhone[0]) {
            throw new BadRequest("Phone already exists");
        }
    }
 

    // بناء كائن التحديث بشكل يحافظ على البيانات الحالية في حال عدم إرسالها
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // لو فيه password جديد
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Admin updated successfully" }, 200);
};

// ✅ Delete Admin
export const deleteAdmin = async (req: Request, res: Response) => {
    const validated = await adminIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 
 
    const existingAdmin = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "admin")))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    // Image handling removed as users schema lacks image column

    await db.delete(users).where(eq(users.id, id));

    SuccessResponse(res, { message: "Admin deleted successfully" }, 200);
};