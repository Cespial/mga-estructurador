export type UserRole = "platform_admin" | "entidad_admin" | "municipio_user";

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
