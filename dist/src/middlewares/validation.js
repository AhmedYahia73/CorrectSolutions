"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const promises_1 = __importDefault(require("fs/promises"));
function gatherFiles(req) {
    const files = [];
    if (req.file)
        files.push(req.file);
    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        }
        else {
            Object.values(req.files)
                .flat()
                .forEach((file) => {
                files.push(file);
            });
        }
    }
    return files;
}
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const files = gatherFiles(req);
                const deleteOps = files.map((file) => file.path
                    ? promises_1.default.unlink(file.path).catch(console.error)
                    : Promise.resolve());
                await Promise.all(deleteOps);
                throw error;
            }
            next(error);
        }
    };
};
exports.validate = validate;
