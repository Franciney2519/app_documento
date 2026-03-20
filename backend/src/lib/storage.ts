import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, env.uploadDir);
  },
  filename: (_request, file, callback) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-");
    callback(null, `${Date.now()}-${base}${ext}`);
  }
});

export const upload = multer({ storage });

export const resolveUploadPath = (relativePath?: string | null) => {
  if (!relativePath) {
    return null;
  }

  return path.resolve(env.uploadDir, relativePath);
};
