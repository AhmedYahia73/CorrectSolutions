// src/middlewares/checkPermission.ts

import { Request, Response, NextFunction } from "express";
import { ModuleName, ActionName } from "../types/constant";
import { Permission } from "../types/custom";

import { db } from "../models/db"; 
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "../Errors";

// ===================== ADMIN PERMISSIONS =====================
  

// // ✅ Middleware للتحقق من صلاحيات Admin/Leader
// export const checkAdminLeader = () => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             const user = req.user;

//             if (!user) {
//                 throw new UnauthorizedError("Authentication required");
//             }

//             if (user.role === "admin" || user.role === "leader") {
//                 return next();
//             }
//             throw new ForbiddenError("You Must Login as Admin or Leader")
//         } catch (error) {
//             next(error);
//         }
//     };
// };

// // ✅ Middleware للتحقق من صلاحيات Admin/Leader
// export const checkAdminLeaderSales = () => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//         try {
//             const user = req.user;

//             if (!user) {
//                 throw new UnauthorizedError("Authentication required");
//             }

//             if (user.role === "admin" || user.role === "leader" || user.role === "sales") {
//                 return next();
//             }
//             throw new ForbiddenError("You Must Login as Admin or Leader or Sales")
//         } catch (error) {
//             next(error);
//         }
//     };
// };

import { verifyToken } from "../utils/auth";

// ✅ Middleware للتحقق من صلاحيات Admin
export const checkOnlyAdmin = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new UnauthorizedError("Authentication required (No token provided)");
                }
                const token = authHeader.split(" ")[1];
                const decoded = verifyToken(token);
                req.user = decoded;
            }

            const user = req.user;

            if (!user) {
                throw new UnauthorizedError("Authentication required");
            }

            if (user.role === "admin") {
                return next();
            }
            throw new ForbiddenError("You Must Login as Admin")
        } catch (error) {
            next(error);
        }
    };
};
 