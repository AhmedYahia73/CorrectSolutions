"use strict";
// src/seeds/03_default_visits.ts
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const seed = {
    name: "03_default_visits",
    async run() {
        console.log("   📝 Inserting rich set of default visits (Catering to various status scenarios)...");
        // فرضية لمعرفات حالات الزيارات (visitStatus) التي قمت بإنشائها لتسهيل الربط التجريبي
        const statusPendingId = "st111111-1111-1111-1111-111111111111"; // قيد المتابعة / الانتظار
        const statusInterestedId = "st222222-2222-2222-2222-222222222222"; // مهتم بالتعاقد
        const statusDoneId = "st333333-3333-3333-3333-333333333333"; // تم التسليم / الإغلاق
        const visitsData = [
            // 🏙️ زيارات منطقة القاهرة والجيزة
            {
                name: "شركة النيل للتجارة والتوزيع",
                phone: "+201011223344",
                lat: 30.0444, // وسط البلد - القاهرة
                lng: 31.2357,
                address: "شارع طلعت حرب، وسط البلد، القاهرة - الدور الثالث",
                notes: "العميل مهتم بنظام الاشتراكات السنوية، يحتاج لمعاودة الاتصال لتحديد موعد توقيع العقد.",
                status: "sales",
                status_id: statusInterestedId,
            },
            {
                name: "سوبر ماركت فريندز",
                phone: "+201211223344",
                lat: 30.0131, // المعادي - القاهرة
                lng: 31.2824,
                address: "شارع 9، المعادي، القاهرة بجوار محطة المترو",
                notes: "تمت الزيارة وعرض المنتج، العميل يطلب تخفيض إضافي بنسبة 5% للموافقة على طلبية الشراء الأولى.",
                status: "visit",
                status_id: statusPendingId,
            },
            {
                name: "مجموعة صيدليات الشفاء",
                phone: "+201111223344",
                lat: 30.0561, // المهندسين - الجيزة
                lng: 31.2017,
                address: "شارع جامعة الدول العربية، المهندسين، الجيزة - أمام مسجد مصطفى محمود",
                notes: "تم إرسال الفاتورة والاتفاق النهائي على توريد الأجهزة الطبية.",
                status: "delivered",
                status_id: statusDoneId,
            },
            // 🌊 زيارات منطقة الإسكندرية
            {
                name: "مطعم البرنس للمأكولات البحرية",
                phone: "+201511223344",
                lat: 31.2001, // محطة الرمل - الإسكندرية
                lng: 29.9187,
                address: "طريق الجيش، محطة الرمل، الإسكندرية - بجوار فندق سيسيل",
                notes: "زيارة ترحيبية وتعريفية بالنظام الجديد، العميل قيد الدراسة والمقارنة مع المنافسين.",
                status: "visit",
                status_id: statusPendingId,
            },
            {
                name: "شركة طيبة للاستيراد والتصدير",
                phone: "+201022334455",
                lat: 31.2241, // سموحة - الإسكندرية
                lng: 29.9548,
                address: "ابراج جرين بلازا، سموحة، الإسكندرية",
                notes: "الزيارة أسفرت عن اتفاق توريد أجهزة مكتبية، تم تأكيد الدفعة الأولى وتسجيل الطلب للقسم المالي.",
                status: "sales",
                status_id: statusInterestedId,
            },
            {
                name: "مكتبة الإسكندرية الحديثة",
                phone: "+201222334455",
                lat: 31.2089, // الأزاريطة - الإسكندرية
                lng: 29.9092,
                address: "شارع بورسعيد، الشاطبي، الإسكندرية",
                notes: "العميل استلم الشحنة كاملة ومطابقة للمواصفات وتم التوقيع على سند الاستلام بنجاح.",
                status: "delivered",
                status_id: statusDoneId,
            },
            // 🌾 زيارات مناطق الدلتا (المنصورة)
            {
                name: "مستشفى الدلتا التخصصي",
                phone: "+201122334455",
                lat: 31.0413, // المنصورة
                lng: 31.3785,
                address: "شارع المشاية السفلية، المنصورة، الدقهلية",
                notes: "العميل يحتاج إلى مراجعة عرض السعر الفني والمالي مع الإدارة الطبية العليا، سيتم المتابعة مطلع الأسبوع المقبل.",
                status: "visit",
                status_id: statusPendingId,
            },
            {
                name: "محلات الهدى للملابس الجاهزة",
                phone: "+201522334455",
                lat: 31.0361, // السكة الجديدة - المنصورة
                lng: 31.3892,
                address: "شارع السكة الجديدة، المنصورة، الدقهلية",
                notes: "تم الاتفاق وإبرام الصفقة وتوريد الدفعة الحالية وجاري تحديث المتطلبات للموسم الجديد.",
                status: "sales",
                status_id: statusInterestedId,
            }
        ];
        console.log("   📥 Saving visits...");
        await db_1.db.insert(schema_1.visits).values(visitsData);
        console.log(`   🚀 Completed! Seeded ${visitsData.length} visits across Cairo, Alexandria, and Mansoura.`);
    },
    async rollback() {
        console.log("   🗑️ Rolling back seeded visits...");
        // حذف البيانات بناءً على الـ UUIDs المحددة التي تم إدخالها فقط لمنع تضرر بيانات التطوير الأخرى
        await db_1.db.delete(schema_1.visits).where((0, drizzle_orm_1.sql) `id LIKE 'v1111111%' OR id LIKE 'v2222222%' OR id LIKE 'v3333333%' OR id LIKE 'v4444444%' OR id LIKE 'v5555555%' OR id LIKE 'v6666666%' OR id LIKE 'v7777777%' OR id LIKE 'v8888888%'`);
        console.log("   ✅ Rollback completed successfully.");
    },
};
exports.default = seed;
