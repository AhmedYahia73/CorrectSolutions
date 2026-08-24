import { Router } from "express";
import {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  createCertificateSchema,
  updateCertificateSchema
} from "../../controllers/admin/certificate";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router();

router.post(
  "/",
  checkOnlyAdmin(),
  validate(createCertificateSchema),
  catchAsync(createCertificate)
);

router.get(
  "/",
  checkOnlyAdmin(),
  catchAsync(getAllCertificates)
);

router.get(
  "/:id",
  checkOnlyAdmin(),
  catchAsync(getCertificateById)
);

router.put(
  "/:id",
  checkOnlyAdmin(),
  validate(updateCertificateSchema),
  catchAsync(updateCertificate)
);

router.delete(
  "/:id",
  checkOnlyAdmin(),
  catchAsync(deleteCertificate)
);

export default router;
