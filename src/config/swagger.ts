// src/config/swagger.ts

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM API Documentation",
      version: "1.0.0",
      description: "API documentation for our Sales & Leaders management system",
    },
    servers: [
      {
        url: "https://salesbcknd.systego.net", 
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // 🔥 التعديل هنا: البحث بعمق داخل المجلدات الفرعية لملفات الـ TypeScript والـ JavaScript
  apis: [
    "./src/routes/**/*.ts",       // يبحث في routes وأي مجلد فرعي داخلها مثل routes/admins
    "./src/controllers/**/*.ts",  // يبحث في controllers وأي مجلد فرعي داخلها مثل controllers/admin
    "./dist/routes/**/*.js",      // للاستخدام بعد عمل build للمشروع
    "./dist/controllers/**/*.js"  // للاستخدام بعد عمل build للمشروع
  ], 
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  // رابط عرض واجهة Swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📝 Swagger documentation is available at https://salesbcknd.systego.net/api-docs");
};