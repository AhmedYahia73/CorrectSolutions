"use strict";
// src/middlewares/checkPermission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOnlyAdmin = void 0;
const Errors_1 = require("../Errors");
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
const auth_1 = require("../utils/auth");
// ✅ Middleware للتحقق من صلاحيات Admin
const checkOnlyAdmin = () => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    throw new Errors_1.UnauthorizedError("Authentication required (No token provided)");
                }
                const token = authHeader.split(" ")[1];
                const decoded = (0, auth_1.verifyToken)(token);
                req.user = decoded;
            }
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            if (user.role === "admin") {
                return next();
            }
            throw new Errors_1.ForbiddenError("You Must Login as Admin");
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkOnlyAdmin = checkOnlyAdmin;
