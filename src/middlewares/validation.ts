import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject, ZodEffects, ZodError } from "zod";
import fs from "fs/promises";

function gatherFiles(req: Request): Express.Multer.File[] {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          files.push(file);
        });
    }
  }
  return files;
}

export const validate = (
  schema: AnyZodObject | ZodEffects<AnyZodObject>
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const files = gatherFiles(req);
        const deleteOps = files.map((file) =>
          file.path
            ? fs.unlink(file.path).catch(console.error)
            : Promise.resolve()
        );
        await Promise.all(deleteOps);
        throw error;
      }
      next(error);
    }
  };
};
