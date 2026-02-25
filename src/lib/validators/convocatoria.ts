import { z } from "zod";

export const createConvocatoriaSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  requisitos: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_cierre: z.string().optional(),
});

export const updateConvocatoriaSchema = createConvocatoriaSchema.partial().extend({
  estado: z.enum(["borrador", "abierta", "cerrada", "evaluacion"]).optional(),
});

export const mgaCampoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "El nombre del campo es requerido"),
  tipo: z.enum(["text", "textarea", "number", "date", "select"]),
  descripcion: z.string(),
  requerido: z.boolean(),
});

export const mgaEtapaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "El nombre de la etapa es requerido"),
  orden: z.number().int().positive(),
  campos: z.array(mgaCampoSchema),
});

export const mgaTemplateSchema = z.object({
  etapas_json: z.array(mgaEtapaSchema),
});

export const assignMunicipioSchema = z.object({
  convocatoria_id: z.string().uuid(),
  municipio_id: z.string().uuid(),
});

// Rubric validation
export const rubricNivelSchema = z.object({
  score: z.number().min(0),
  label: z.string().min(1, "La etiqueta del nivel es requerida"),
  descripcion: z.string(),
});

export const rubricCriterioSchema = z.object({
  campo_id: z.string().min(1, "El campo es requerido"),
  peso: z.number().positive("El peso debe ser mayor a 0"),
  descripcion: z.string().min(1, "La descripción del criterio es requerida"),
  niveles: z.array(rubricNivelSchema).min(1, "Debe tener al menos un nivel"),
});

export const rubricCriteriosSchema = z
  .array(rubricCriterioSchema)
  .min(1, "Debe tener al menos un criterio de evaluación");

// Document validation
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type CreateConvocatoriaInput = z.infer<typeof createConvocatoriaSchema>;
export type UpdateConvocatoriaInput = z.infer<typeof updateConvocatoriaSchema>;
export type MgaTemplateInput = z.infer<typeof mgaTemplateSchema>;
