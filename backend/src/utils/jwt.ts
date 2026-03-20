import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  sub: string;
}

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId } satisfies TokenPayload, env.jwtSecret, { expiresIn: "12h" });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as TokenPayload;
