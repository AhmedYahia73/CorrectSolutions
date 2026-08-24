import { Router } from "express";
import admin from "./admin";
import auth from "./auth";
import certificateRouter from "./certificate";
import settingsRouter from "./settings";

const router = Router();

router.use("/admin", admin);
router.use("/auth", auth);
router.use("/certificate", certificateRouter);
router.use("/settings", settingsRouter);

export default router;
