import { Router } from "express";
import {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  uploadCertificateImages,
  createCertificateSchema,
  updateCertificateSchema
} from "../../controllers/admin/certificate";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { uploadCertificateImagesMiddleware } from "../../middlewares/uploadMiddleware";

const router = Router();

router.post(
  "/upload-images",
  checkOnlyAdmin(),
  uploadCertificateImagesMiddleware,
  catchAsync(uploadCertificateImages)
);

router.post(
  "/",
  checkOnlyAdmin(),
  validate(createCertificateSchema),
  catchAsync(createCertificate)
);

router.get(
  "/",
  catchAsync(getAllCertificates)
);

router.get(
  "/:id",
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
