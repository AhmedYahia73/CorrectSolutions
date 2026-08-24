import { Router } from "express";
import {
    getAllAdmin,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
} from "../../controllers/admin/admin";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router();
 
router.get("/", checkOnlyAdmin(), catchAsync(getAllAdmin));
 
router.get("/:id", checkOnlyAdmin(), catchAsync(getAdminById));
 
router.post("/", checkOnlyAdmin(), catchAsync(createAdmin));
 
router.put("/:id", checkOnlyAdmin(), catchAsync(updateAdmin));
 
router.delete("/:id", checkOnlyAdmin(), catchAsync(deleteAdmin));

export default router;
