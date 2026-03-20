import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { sectorRouter } from "./routes/sector.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(
  cors({
    origin: env.appUrl,
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "neo-fala-amazonia-api" });
});

app.use("/auth", authRouter);
app.use("/sectors", sectorRouter);
app.use("/documents", documentRouter);
app.use("/admin", adminRouter);
app.use(errorHandler);

export default app;

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`API Neo Fala Amazonia disponivel em ${env.apiUrl}`);
  });
}
