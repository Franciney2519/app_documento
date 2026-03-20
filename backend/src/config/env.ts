import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const required = ["DATABASE_URL", "JWT_SECRET"] as const;

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

const parseCookieSameSite = (value?: string): "lax" | "strict" | "none" => {
  switch ((value ?? "").toLowerCase()) {
    case "strict":
      return "strict";
    case "none":
      return "none";
    case "lax":
    case "":
      return "lax";
    default:
      throw new Error(`Valor invalido para COOKIE_SAME_SITE: ${value}`);
  }
};

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
};

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
}

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  cookieName: process.env.COOKIE_NAME ?? "nfa_token",
  cookieSameSite: parseCookieSameSite(process.env.COOKIE_SAME_SITE ?? (isProduction ? "none" : "lax")),
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  port: Number(process.env.PORT ?? 4000),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? (isProduction ? "/tmp/uploads" : "../storage/uploads"))
};
