import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Dados invalidos.",
      issues: error.issues
    });
  }

  if (error instanceof Error) {
    return response.status(500).json({ message: error.message });
  }

  return response.status(500).json({ message: "Erro interno inesperado." });
};
