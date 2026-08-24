"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const target_1 = require("../../controllers/admin/target");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Targets
 *   description: Target management endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Target:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [visit, sales]
 *         name:
 *           type: string
 *         number:
 *           type: number
 *     CreateTargetBody:
 *       type: object
 *       required:
 *         - name
 *         - number
 *       properties:
 *         type:
 *           type: string
 *           enum: [visit, sales]
 *           default: visit
 *           example: visit
 *         name:
 *           type: string
 *           example: Q3 Sales Target
 *         number:
 *           type: number
 *           example: 100
 *     UpdateTargetBody:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [visit, sales]
 *         name:
 *           type: string
 *         number:
 *           type: number
 */
/**
 * @swagger
 * /api/admin/target:
 *   get:
 *     summary: Get all targets
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of targets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sales:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Target'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.getAllTargets));
router.get("/sales/lists", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.lists));
/**
 * @swagger
 * /api/admin/target/{id}:
 *   get:
 *     summary: Get target by ID
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Target ID
 *     responses:
 *       200:
 *         description: Target data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Targets:
 *                   $ref: '#/components/schemas/Target'
 *       404:
 *         description: Target not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.getTargetsById));
/**
 * @swagger
 * /api/admin/target:
 *   post:
 *     summary: Create a new target
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTargetBody'
 *     responses:
 *       201:
 *         description: Target created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Targets created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.createTargets));
/**
 * @swagger
 * /api/admin/target/{id}:
 *   put:
 *     summary: Update target by ID
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Target ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTargetBody'
 *     responses:
 *       200:
 *         description: Target updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Targets updated successfully
 *       404:
 *         description: Target not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.updateTargets));
/**
 * @swagger
 * /api/admin/target/{id}:
 *   delete:
 *     summary: Delete target by ID
 *     tags: [Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Target ID
 *     responses:
 *       200:
 *         description: Target deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Targets deleted successfully
 *       404:
 *         description: Target not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(target_1.deleteTargets));
exports.default = router;
