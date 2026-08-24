"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const status_1 = require("../../controllers/admin/status");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Visit Status
 *   description: Visit status management endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     VisitStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: boolean
 *           description: Whether this status is active or not
 *     CreateVisitStatusBody:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: In Progress
 *         status:
 *           type: boolean
 *           example: true
 *     UpdateVisitStatusBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         status:
 *           type: boolean
 */
/**
 * @swagger
 * /api/admin/visit_status:
 *   get:
 *     summary: Get all visit statuses
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all visit statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allVisitStatuss:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VisitStatus'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(status_1.getAllVisitStatuss));
/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   get:
 *     summary: Get visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     responses:
 *       200:
 *         description: Visit status data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 VisitStatuss:
 *                   $ref: '#/components/schemas/VisitStatus'
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(status_1.getVisitStatussById));
/**
 * @swagger
 * /api/admin/visit_status:
 *   post:
 *     summary: Create a new visit status
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisitStatusBody'
 *     responses:
 *       201:
 *         description: Visit status created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(status_1.createVisitStatuss));
/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   put:
 *     summary: Update visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVisitStatusBody'
 *     responses:
 *       200:
 *         description: Visit status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss updated successfully
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(status_1.updateVisitStatuss));
/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   delete:
 *     summary: Delete visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     responses:
 *       200:
 *         description: Visit status deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss deleted successfully
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(status_1.deleteVisitStatuss));
exports.default = router;
