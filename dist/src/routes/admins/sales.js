"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_1 = require("../../controllers/admin/sales");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales staff management endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Sales:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         target:
 *           type: string
 *           nullable: true
 *         target_number:
 *           type: number
 *           nullable: true
 *         leader_name:
 *           type: string
 *           nullable: true
 *         leader_phone:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     CreateSalesBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *         - leader_id
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: Mohamed Hassan
 *         email:
 *           type: string
 *           format: email
 *           example: mohamed@example.com
 *         phone:
 *           type: string
 *           example: "01098765432"
 *         password:
 *           type: string
 *           example: secret123
 *         image:
 *           type: string
 *           nullable: true
 *           description: Base64 encoded image string
 *         leader_id:
 *           type: string
 *           format: uuid
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *     UpdateSalesBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         password:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *           description: Base64 encoded image string
 *         leader_id:
 *           type: string
 *           format: uuid
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     SalesListsResponse:
 *       type: object
 *       properties:
 *         target_list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TargetListItem'
 *         leaders:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 */
/**
 * @swagger
 * /api/admin/sales:
 *   get:
 *     summary: Get all sales staff
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales staff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sales:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sales'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", (0, checkpermission_1.checkAdminLeader)(), (0, catchAsync_1.catchAsync)(sales_1.getAllSales));
/**
 * @swagger
 * /api/admin/sales/lists:
 *   get:
 *     summary: Get targets and leaders dropdown lists
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dropdown lists for targets and leaders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SalesListsResponse'
 *       401:
 *         description: Unauthorized
 */
router.get("/lists", (0, checkpermission_1.checkAdminLeader)(), (0, catchAsync_1.catchAsync)(sales_1.lists));
/**
 * @swagger
 * /api/admin/sales/{id}:
 *   get:
 *     summary: Get sales staff member by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales UUID
 *     responses:
 *       200:
 *         description: Sales member data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sales:
 *                   $ref: '#/components/schemas/Sales'
 *       404:
 *         description: Sales not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", (0, checkpermission_1.checkAdminLeader)(), (0, catchAsync_1.catchAsync)(sales_1.getSalesById));
/**
 * @swagger
 * /api/admin/sales:
 *   post:
 *     summary: Create a new sales staff member
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSalesBody'
 *     responses:
 *       201:
 *         description: Sales created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sales created successfully
 *       400:
 *         description: Email or Phone already exists / Invalid leader
 *       401:
 *         description: Unauthorized
 */
router.post("/", (0, checkpermission_1.checkAdminLeader)(), (0, catchAsync_1.catchAsync)(sales_1.createSales));
/**
 * @swagger
 * /api/admin/sales/{id}:
 *   put:
 *     summary: Update sales staff member by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSalesBody'
 *     responses:
 *       200:
 *         description: Sales updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sales updated successfully
 *       400:
 *         description: Email or Phone already exists / Invalid leader
 *       404:
 *         description: Sales not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(sales_1.updateSales));
/**
 * @swagger
 * /api/admin/sales/{id}:
 *   delete:
 *     summary: Delete sales staff member by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales UUID
 *     responses:
 *       200:
 *         description: Sales deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sales deleted successfully
 *       404:
 *         description: Sales not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(sales_1.deleteSales));
exports.default = router;
