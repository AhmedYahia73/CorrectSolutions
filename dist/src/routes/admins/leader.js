"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leader_1 = require("../../controllers/admin/leader");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Leaders
 *   description: Leader management endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Leader:
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
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     CreateLeaderBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: Ahmed Ali
 *         email:
 *           type: string
 *           format: email
 *           example: ahmed@example.com
 *         phone:
 *           type: string
 *           example: "01012345678"
 *         password:
 *           type: string
 *           example: secret123
 *         image:
 *           type: string
 *           nullable: true
 *           description: Base64 encoded image string
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *     UpdateLeaderBody:
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
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     TargetListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 */
/**
 * @swagger
 * /api/admin/leader:
 *   get:
 *     summary: Get all leaders
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leaders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Leader'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.getAllLeader));
/**
 * @swagger
 * /api/admin/leader/lists:
 *   get:
 *     summary: Get targets dropdown list
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of targets for dropdown selection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 target_list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TargetListItem'
 *       401:
 *         description: Unauthorized
 */
router.get("/lists", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.lists));
/**
 * @swagger
 * /api/admin/leader/{id}:
 *   get:
 *     summary: Get leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     responses:
 *       200:
 *         description: Leader data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leader:
 *                   $ref: '#/components/schemas/Leader'
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.getLeaderById));
/**
 * @swagger
 * /api/admin/leader:
 *   post:
 *     summary: Create a new leader
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeaderBody'
 *     responses:
 *       201:
 *         description: Leader created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader created successfully
 *       400:
 *         description: Email or Phone already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.createLeader));
/**
 * @swagger
 * /api/admin/leader/{id}:
 *   put:
 *     summary: Update leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLeaderBody'
 *     responses:
 *       200:
 *         description: Leader updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader updated successfully
 *       400:
 *         description: Email or Phone already exists
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.updateLeader));
/**
 * @swagger
 * /api/admin/leader/{id}:
 *   delete:
 *     summary: Delete leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     responses:
 *       200:
 *         description: Leader deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader deleted successfully
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(leader_1.deleteLeader));
exports.default = router;
