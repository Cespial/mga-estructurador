import { z } from "zod";

// Organization
export const createOrganizationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["entity", "municipality"]),
  nit: z.string().optional(),
  municipality: z.string().optional(),
  department: z.string().optional(),
});

// Convocatoria
export const createConvocatoriaV2Schema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
  open_date: z.string().optional(),
  close_date: z.string().optional(),
});

export const updateConvocatoriaV2Schema = createConvocatoriaV2Schema.partial().extend({
  status: z.enum(["draft", "open", "closed", "evaluating", "resolved"]).optional(),
  form_schema: z.any().optional(),
});

// Rubric
export const createRubricSchema = z.object({
  name: z.string().min(1),
  total_score: z.number().positive().default(100),
});

export const createRubricCriterionSchema = z.object({
  criterion_name: z.string().min(1, "El nombre del criterio es requerido"),
  max_score: z.number().positive("El puntaje maximo debe ser positivo"),
  weight: z.number().positive("El peso debe ser positivo"),
  evaluation_guide: z.string().optional(),
  sort_order: z.number().int().default(0),
});

// Project
export const createProjectSchema = z.object({
  convocatoria_id: z.string().uuid(),
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  budget_requested: z.number().positive().optional(),
});

// Project Form
export const updateProjectFormSchema = z.object({
  form_data: z.record(z.string(), z.unknown()),
  completed: z.boolean().optional(),
});

// Scoring
export const createScoringJobSchema = z.object({
  project_id: z.string().uuid(),
  rubric_id: z.string().uuid(),
  evaluator_type: z.enum(["ai", "human"]).default("ai"),
});

// AI Chat
export const aiChatMessageSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().min(1),
  step_number: z.number().int().optional(),
});

// Wizard step definition
export const wizardFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "number", "currency", "select", "date", "file"]),
  description: z.string().optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  aiAssistable: z.boolean().default(false),
});

export const wizardStepSchema = z.object({
  step_number: z.number().int().positive(),
  step_name: z.string(),
  description: z.string(),
  fields: z.array(wizardFieldSchema),
});

// Type exports
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateConvocatoriaV2Input = z.infer<typeof createConvocatoriaV2Schema>;
export type UpdateConvocatoriaV2Input = z.infer<typeof updateConvocatoriaV2Schema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateScoringJobInput = z.infer<typeof createScoringJobSchema>;
export type AiChatMessageInput = z.infer<typeof aiChatMessageSchema>;
