export type UserRole = "platform_admin" | "entidad_admin" | "municipio_user";

export type ConvocatoriaEstado = "borrador" | "abierta" | "cerrada" | "evaluacion";

export type ConvocatoriaMunicipioEstado = "invitado" | "activo" | "completado" | "retirado";

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

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

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

// Joined types for UI convenience
export interface ConvocatoriaWithTemplate extends Convocatoria {
  mga_templates: MgaTemplate | null;
}

export interface ConvocatoriaMunicipioWithDetails extends ConvocatoriaMunicipio {
  municipios: Municipio;
}

export interface ConvocatoriaMunicipioWithConvocatoria extends ConvocatoriaMunicipio {
  convocatorias: Convocatoria;
}
