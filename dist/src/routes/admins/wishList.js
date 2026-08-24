"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_1 = require("../../controllers/admin/wishlist");
const catchAsync_1 = require("../../utils/catchAsync");
const checkpermission_1 = require("../../middlewares/checkpermission");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Wish List
 *   description: Wish list management endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     WishList:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *     CreateWishListBody:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Premium Products
 *         description:
 *           type: string
 *           nullable: true
 *           example: High-value product wishlist
 *     UpdateWishListBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 */
/**
 * @swagger
 * /api/admin/wish_list:
 *   get:
 *     summary: Get all wish lists
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all wish lists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allWishLists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishList'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", (0, checkpermission_1.checkAdminLeaderSales)(), (0, catchAsync_1.catchAsync)(wishlist_1.getAllWishLists));
/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   get:
 *     summary: Get wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     responses:
 *       200:
 *         description: Wish list data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 WishList:
 *                   $ref: '#/components/schemas/WishList'
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(wishlist_1.getWishListsById));
/**
 * @swagger
 * /api/admin/wish_list:
 *   post:
 *     summary: Create a new wish list
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWishListBody'
 *     responses:
 *       201:
 *         description: Wish list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(wishlist_1.createWishLists));
/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   put:
 *     summary: Update wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWishListBody'
 *     responses:
 *       200:
 *         description: Wish list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList updated successfully
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(wishlist_1.updateWishLists));
/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   delete:
 *     summary: Delete wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     responses:
 *       200:
 *         description: Wish list deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList deleted successfully
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", (0, checkpermission_1.checkOnlyAdmin)(), (0, catchAsync_1.catchAsync)(wishlist_1.deleteWishLists));
exports.default = router;
