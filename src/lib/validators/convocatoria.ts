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

export type CreateConvocatoriaInput = z.infer<typeof createConvocatoriaSchema>;
export type UpdateConvocatoriaInput = z.infer<typeof updateConvocatoriaSchema>;
export type MgaTemplateInput = z.infer<typeof mgaTemplateSchema>;
