// ── Enums ──
export type OrgType = "entity" | "municipality";
export type ConvocatoriaStatus = "draft" | "open" | "closed" | "evaluating" | "resolved";
export type ProjectStatus = "draft" | "submitted" | "under_review" | "scored" | "approved" | "rejected";
export type ScoreStatus = "pending" | "processing" | "completed" | "failed";
export type EvaluatorType = "ai" | "human";
export type StageStatus = "pending" | "active" | "completed";
export type ChatRole = "user" | "assistant" | "system";
export type ScoringJobStatus = "pending" | "claimed" | "processing" | "completed" | "failed";

// Keep old types as deprecated for backward compatibility during migration
export type UserRole = "platform_admin" | "entidad_admin" | "municipio_user";
export type ConvocatoriaEstado = "borrador" | "abierta" | "cerrada" | "evaluacion";
export type ConvocatoriaMunicipioEstado = "invitado" | "activo" | "completado" | "retirado";
export type DocumentStatus = "pending" | "processing" | "ready" | "error";

// ── New PuBlitec Domain Models ──
export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  type: OrgType;
  nit: string | null;
  municipality: string | null;
  department: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PuBlitecConvocatoria {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ConvocatoriaStatus;
  budget: number | null;
  open_date: string | null;
  close_date: string | null;
  form_schema: WizardStepDefinition[];
  created_at: string;
  updated_at: string;
}

export interface Rubric {
  id: string;
  convocatoria_id: string;
  name: string;
  total_score: number;
  created_at: string;
}

/** @deprecated Legacy rubric type — use Rubric + RubricCriterion instead */
export interface LegacyRubric {
  id: string;
  convocatoria_id: string;
  tenant_id: string;
  criterios_json: RubricCriterio[];
  created_at: string;
  updated_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  criterion_name: string;
  max_score: number;
  weight: number;
  evaluation_guide: string | null;
  sort_order: number;
  created_at: string;
}

export interface ConvocatoriaStage {
  id: string;
  convocatoria_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  status: StageStatus;
  created_at: string;
}

export interface Project {
  id: string;
  convocatoria_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  budget_requested: number | null;
  status: ProjectStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectForm {
  id: string;
  project_id: string;
  step_number: number;
  step_name: string;
  form_data: Record<string, unknown>;
  ai_suggestions: AiSuggestion[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  field_id: string;
  suggested_text: string;
  applied: boolean;
  timestamp: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ProjectScore {
  id: string;
  project_id: string;
  rubric_id: string;
  evaluator_type: EvaluatorType;
  total_score: number | null;
  total_weighted_score: number | null;
  ai_summary: string | null;
  status: ScoreStatus;
  created_at: string;
  updated_at: string;
}

export interface CriteriaScore {
  id: string;
  project_score_id: string;
  rubric_criteria_id: string;
  score: number;
  max_score: number;
  weight: number;
  weighted_score: number | null;
  justification: string | null;
  ai_rationale: string | null;
  created_at: string;
}

export interface ScoringJob {
  id: string;
  project_score_id: string;
  engine_version: string;
  config: Record<string, unknown>;
  status: ScoringJobStatus;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessage {
  id: string;
  project_id: string;
  role: ChatRole;
  content: string;
  step_number: number | null;
  created_at: string;
}

// ── Wizard Step Types ──
export type WizardFieldType = "text" | "textarea" | "number" | "currency" | "select" | "date" | "file";

export interface WizardField {
  id: string;
  label: string;
  type: WizardFieldType;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select fields
  aiAssistable: boolean;
}

export interface WizardStepDefinition {
  step_number: number;
  step_name: string;
  description: string;
  fields: WizardField[];
}

// ── Joined Types ──
export interface ConvocatoriaWithRubric extends PuBlitecConvocatoria {
  rubrics_v2: (Rubric & { rubric_criteria: RubricCriterion[] })[];
  organization?: Organization;
}

export interface ProjectWithDetails extends Project {
  project_forms: ProjectForm[];
  project_documents: ProjectDocument[];
  project_scores: ProjectScore[];
  convocatorias_v2?: PuBlitecConvocatoria;
  organization?: Organization;
}

export interface ProjectScoreWithCriteria extends ProjectScore {
  criteria_scores: CriteriaScore[];
  rubrics_v2?: Rubric & { rubric_criteria: RubricCriterion[] };
}

// ── Keep old types for backward compat ──
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Municipio {
  id: string;
  codigo_dane: string | null;
  nombre: string;
  departamento: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  tenant_id: string | null;
  municipio_id: string | null;
  created_at: string;
  updated_at: string;
}

// Old Convocatoria kept as legacy
export interface Convocatoria {
  id: string;
  tenant_id: string;
  nombre: string;
  descripcion: string | null;
  requisitos: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  estado: ConvocatoriaEstado;
  created_at: string;
  updated_at: string;
}

export interface MgaCampo {
  id: string;
  nombre: string;
  tipo: "text" | "textarea" | "number" | "date" | "select";
  descripcion: string;
  requerido: boolean;
}

export interface MgaEtapa {
  id: string;
  nombre: string;
  orden: number;
  campos: MgaCampo[];
}

export interface MgaTemplate {
  id: string;
  convocatoria_id: string;
  etapas_json: MgaEtapa[];
  created_at: string;
  updated_at: string;
}

export interface ConvocatoriaMunicipio {
  id: string;
  convocatoria_id: string;
  municipio_id: string;
  estado: ConvocatoriaMunicipioEstado;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  convocatoria_id: string;
  municipio_id: string;
  data_json: Record<string, string>;
  etapa_actual: string | null;
  progress: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  convocatoria_id: string;
  tenant_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Embedding {
  id: string;
  document_id: string;
  convocatoria_id: string;
  chunk_index: number;
  chunk_text: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RubricNivel {
  score: number;
  label: string;
  descripcion: string;
}

export interface RubricCriterio {
  campo_id: string;
  peso: number;
  descripcion: string;
  niveles: RubricNivel[];
}

export interface EvaluationScore {
  campo_id: string;
  campo_nombre: string;
  score: number;
  max_score: number;
  justificacion: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  convocatoria_id: string;
  municipio_id: string;
  etapa_id: string;
  scores_json: EvaluationScore[];
  total_score: number;
  max_score: number;
  recomendaciones: string[];
  evaluated_by: string | null;
  llm_model: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConvocatoriaWithTemplate extends Convocatoria {
  mga_templates: MgaTemplate | null;
}

export interface ConvocatoriaMunicipioWithDetails extends ConvocatoriaMunicipio {
  municipios: Municipio;
}

export interface ConvocatoriaMunicipioWithConvocatoria extends ConvocatoriaMunicipio {
  convocatorias: Convocatoria;
}
