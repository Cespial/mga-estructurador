import { z } from "zod";

/** Shared Zod schemas for AI endpoint request validation */

export const autoDraftSchema = z.object({
  convocatoria_id: z.string().uuid("convocatoria_id debe ser UUID"),
  submission_id: z.string().uuid("submission_id debe ser UUID"),
  etapa_id: z.string().min(1, "etapa_id requerido"),
  campo_ids: z.array(z.string()).optional(),
  existing_data: z.record(z.string(), z.string()).optional(),
});

export const improveSchema = z.object({
  texto_actual: z.string().min(1, "texto_actual requerido"),
  campo_nombre: z.string().min(1, "campo_nombre requerido"),
  campo_descripcion: z.string().default(""),
  convocatoria_id: z.string().uuid().optional(),
  recomendacion: z.string().optional(),
});

export const validateStepSchema = z.object({
  convocatoria_id: z.string().uuid("convocatoria_id debe ser UUID"),
  submission_id: z.string().uuid("submission_id debe ser UUID"),
  etapa_id: z.string().min(1, "etapa_id requerido"),
  data_json: z.record(z.string(), z.string()).optional(),
});

export const nudgeSchema = z.object({
  campo_nombre: z.string().min(1),
  campo_descripcion: z.string().default(""),
  texto_actual: z.string().min(1),
  criterio_rubrica: z.string().optional(),
});

export const healthCheckSchema = z.object({
  fields: z.record(z.string(), z.string()),
  step_name: z.string().min(1, "step_name requerido"),
  project_title: z.string().default("Sin titulo"),
});

export const compareFieldSchema = z.object({
  convocatoria_id: z.string().uuid("convocatoria_id debe ser UUID"),
  submission_id: z.string().uuid("submission_id debe ser UUID"),
  etapa_id: z.string().min(1),
  campo_id: z.string().min(1),
  campo_nombre: z.string().min(1),
  current_value: z.string().default(""),
});

export const suggestRubricSchema = z.object({
  convocatoria_id: z.string().uuid("convocatoria_id debe ser UUID"),
});

export const generateProjectSchema = z.object({
  project_id: z.string().uuid("project_id debe ser UUID"),
});

export const matchConvocatoriasSchema = z.object({});

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; error: string; status: number };

/**
 * Helper to parse and validate a request body with a Zod schema.
 * Returns { success: true, data } on success, { success: false, error, status } on failure.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseSuccess<z.infer<T>> | ParseFailure> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { success: false, error: "Request body invalido — JSON esperado", status: 400 };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      success: false,
      error: `Validacion: ${firstIssue?.path.join(".")} — ${firstIssue?.message}`,
      status: 400,
    };
  }

  return { success: true, data: result.data };
}
