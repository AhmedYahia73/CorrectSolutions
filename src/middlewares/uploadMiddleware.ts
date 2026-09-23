import multer from "multer";
import { Request } from "express";
import { BadRequest } from "../Errors/BadRequest";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new BadRequest("Only image files are allowed"));
  }
};

export const uploadCertificateImagesMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 20, // up to 20 files per batch
  },
  fileFilter,
}).array("images", 20);
