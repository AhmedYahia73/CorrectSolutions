"use strict";
// // src/utils/subscriptionCheck.ts
Object.defineProperty(exports, "__esModule", { value: true });
// import { ForbiddenError } from "../Errors";
// import { db } from "../models/db";
// import { subscriptions } from "../models/schema";
// import { plans } from "../models/schema";
// import { buses } from "../models/schema";
// import { drivers } from "../models/schema"; // لو عايز تستخدمه لاحقاً
// import { students } from "../models/schema"; // لو عايز تستخدمه لاحقاً
// import { eq, and, count, gte } from "drizzle-orm";
// interface SubscriptionWithPlan {
//   subscription: typeof subscriptions.$inferSelect;
//   plan: typeof plans.$inferSelect;
// }
// // جلب الاشتراك النشط مع الخطة
// export const getActiveSubscription = async (
//   organizationId: string
// ): Promise<SubscriptionWithPlan | null> => {
//   try {
//     const now = new Date();
//     const result = await db
//       .select({
//         subscription: subscriptions,
//         plan: plans,
//       })
//       .from(subscriptions)
//       .innerJoin(plans, eq(subscriptions.planId, plans.id))
//       .where(
//         and(
//           eq(subscriptions.organizationId, organizationId),
//           eq(subscriptions.isActive, true),
//           gte(subscriptions.endDate, now)
//         )
//       )
//       .limit(1);
//     return result[0] || null;
//   } catch (error) {
//     console.error("Error fetching active subscription:", error);
//     return null;
//   }
// };
// // ✅ التحقق من حد الباصات
// export const checkBusLimit = async (organizationId: string): Promise<void> => {
//   const activeSubscription = await getActiveSubscription(organizationId);
//   if (!activeSubscription) {
//     throw new ForbiddenError(
//       "No active subscription found. Please subscribe to a plan first."
//     );
//   }
//   const { plan } = activeSubscription;
//   if (plan.maxBuses === null) {
//     return;
//   }
//   const [busCount] = await db
//     .select({ count: count() })
//     .from(buses)
//     .where(eq(buses.organizationId, organizationId));
//   if (busCount.count >= plan.maxBuses) {
//     throw new ForbiddenError(
//       `Bus limit reached (${busCount.count}/${plan.maxBuses}). Please upgrade your plan.`
//     );
//   }
// };
// // ✅ التحقق من حد السائقين
// export const checkDriverLimit = async (organizationId: string): Promise<void> => {
//   const activeSubscription = await getActiveSubscription(organizationId);
//   if (!activeSubscription) {
//     throw new ForbiddenError(
//       "No active subscription found. Please subscribe to a plan first."
//     );
//   }
//   const { plan } = activeSubscription;
//   if (plan.maxDrivers === null) {
//     return;
//   }
//   const [driverCount] = await db
//     .select({ count: count() })
//     .from(drivers)
//     .where(eq(drivers.organizationId, organizationId));
//   if (driverCount.count >= plan.maxDrivers) {
//     throw new ForbiddenError(
//       `Driver limit reached (${driverCount.count}/${plan.maxDrivers}). Please upgrade your plan.`
//     );
//   }
// };
// // ✅ التحقق من حد الطلاب
// export const checkStudentLimit = async (organizationId: string): Promise<void> => {
//   const activeSubscription = await getActiveSubscription(organizationId);
//   if (!activeSubscription) {
//     throw new ForbiddenError(
//       "No active subscription found. Please subscribe to a plan first."
//     );
//   }
//   const { plan } = activeSubscription;
//   if (plan.maxStudents === null) {
//     return;
//   }
//   const [studentCount] = await db
//     .select({ count: count() })
//     .from(students)
//     .where(eq(students.organizationId, organizationId));
//   if (studentCount.count >= plan.maxStudents) {
//     throw new ForbiddenError(
//       `Student limit reached (${studentCount.count}/${plan.maxStudents}). Please upgrade your plan.`
//     );
//   }
// };
// // ✅ جلب كل معلومات الاستخدام
// export const getUsageInfo = async (organizationId: string) => {
//   const activeSubscription = await getActiveSubscription(organizationId);
//   if (!activeSubscription) {
//     return null;
//   }
//   const { plan, subscription } = activeSubscription;
//   const [busCount] = await db
//     .select({ count: count() })
//     .from(buses)
//     .where(eq(buses.organizationId, organizationId));
//   const [driverCount] = await db
//     .select({ count: count() })
//     .from(drivers)
//     .where(eq(drivers.organizationId, organizationId));
//   const [studentCount] = await db
//     .select({ count: count() })
//     .from(students)
//     .where(eq(students.organizationId, organizationId));
//   return {
//     plan: {
//       id: plan.id,
//       name: plan.name,
//     },
//     usage: {
//       buses: {
//         used: busCount.count,
//         max: plan.maxBuses,
//         remaining: plan.maxBuses ? plan.maxBuses - busCount.count : "unlimited",
//       },
//       drivers: {
//         used: driverCount.count,
//         max: plan.maxDrivers,
//         remaining: plan.maxDrivers ? plan.maxDrivers - driverCount.count : "unlimited",
//       },
//       students: {
//         used: studentCount.count,
//         max: plan.maxStudents,
//         remaining: plan.maxStudents ? plan.maxStudents - studentCount.count : "unlimited",
//       },
//     },
//     subscription: {
//       startDate: subscription.startDate,
//       endDate: subscription.endDate,
//       isActive: subscription.isActive,
//     },
//   };
// };
