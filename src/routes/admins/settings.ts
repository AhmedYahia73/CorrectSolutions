import { Router } from "express";
import {
  getSettings,
  updateSettings,
  updateSettingsSchema
} from "../../controllers/admin/settings";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router();

router.get(
  "/",
  catchAsync(getSettings)
);

router.put(
  "/",
  checkOnlyAdmin(),
  validate(updateSettingsSchema),
  catchAsync(updateSettings)
);

export default router;
