import { describe, it, expect } from "vitest";
import {
  autoDraftSchema,
  improveSchema,
  validateStepSchema,
  nudgeSchema,
  healthCheckSchema,
  compareFieldSchema,
  suggestRubricSchema,
  generateProjectSchema,
  parseBody,
} from "../validation";

// ---------------------------------------------------------------------------
// Schema validation tests
// ---------------------------------------------------------------------------

describe("autoDraftSchema", () => {
  it("accepts valid input with required fields", () => {
    const result = autoDraftSchema.safeParse({
      convocatoria_id: "550e8400-e29b-41d4-a716-446655440000",
      submission_id: "550e8400-e29b-41d4-a716-446655440001",
      etapa_id: "identificacion",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID convocatoria_id", () => {
    const result = autoDraftSchema.safeParse({
      convocatoria_id: "not-a-uuid",
      submission_id: "550e8400-e29b-41d4-a716-446655440001",
      etapa_id: "identificacion",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty etapa_id", () => {
    const result = autoDraftSchema.safeParse({
      convocatoria_id: "550e8400-e29b-41d4-a716-446655440000",
      submission_id: "550e8400-e29b-41d4-a716-446655440001",
      etapa_id: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional campo_ids and existing_data", () => {
    const result = autoDraftSchema.safeParse({
      convocatoria_id: "550e8400-e29b-41d4-a716-446655440000",
      submission_id: "550e8400-e29b-41d4-a716-446655440001",
      etapa_id: "presupuesto",
      campo_ids: ["campo_1", "campo_2"],
      existing_data: { campo_3: "valor existente" },
    });
    expect(result.success).toBe(true);
  });
});

describe("improveSchema", () => {
  it("accepts valid input", () => {
    const result = improveSchema.safeParse({
      texto_actual: "Texto original",
      campo_nombre: "Objetivo",
    });
    expect(result.success).toBe(true);
  });

  it("defaults campo_descripcion to empty string", () => {
    const result = improveSchema.safeParse({
      texto_actual: "Texto",
      campo_nombre: "Campo",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campo_descripcion).toBe("");
    }
  });

  it("rejects empty texto_actual", () => {
    const result = improveSchema.safeParse({
      texto_actual: "",
      campo_nombre: "Campo",
    });
    expect(result.success).toBe(false);
  });
});

describe("nudgeSchema", () => {
  it("accepts valid input", () => {
    const result = nudgeSchema.safeParse({
      campo_nombre: "Presupuesto",
      texto_actual: "100 millones",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing campo_nombre", () => {
    const result = nudgeSchema.safeParse({
      texto_actual: "algo",
    });
    expect(result.success).toBe(false);
  });
});

describe("healthCheckSchema", () => {
  it("accepts valid input", () => {
    const result = healthCheckSchema.safeParse({
      fields: { titulo: "Mi proyecto", descripcion: "Descripcion" },
      step_name: "Identificacion",
    });
    expect(result.success).toBe(true);
  });

  it("defaults project_title to 'Sin titulo'", () => {
    const result = healthCheckSchema.safeParse({
      fields: { f1: "v1" },
      step_name: "Paso 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_title).toBe("Sin titulo");
    }
  });
});

describe("compareFieldSchema", () => {
  it("accepts valid input", () => {
    const result = compareFieldSchema.safeParse({
      convocatoria_id: "550e8400-e29b-41d4-a716-446655440000",
      submission_id: "550e8400-e29b-41d4-a716-446655440001",
      etapa_id: "e1",
      campo_id: "c1",
      campo_nombre: "Objetivo",
    });
    expect(result.success).toBe(true);
  });
});

describe("suggestRubricSchema", () => {
  it("requires a valid UUID", () => {
    expect(
      suggestRubricSchema.safeParse({
        convocatoria_id: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
    expect(
      suggestRubricSchema.safeParse({ convocatoria_id: "bad" }).success,
    ).toBe(false);
  });
});

describe("generateProjectSchema", () => {
  it("requires a valid UUID project_id", () => {
    expect(
      generateProjectSchema.safeParse({
        project_id: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
    expect(
      generateProjectSchema.safeParse({ project_id: "nope" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseBody tests
// ---------------------------------------------------------------------------

describe("parseBody", () => {
  it("parses a valid JSON body against a schema", async () => {
    const body = JSON.stringify({
      texto_actual: "Hola",
      campo_nombre: "Titulo",
    });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(req, improveSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.texto_actual).toBe("Hola");
    }
  });

  it("returns error for invalid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "text/plain" },
    });

    const result = await parseBody(req, improveSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("JSON");
    }
  });

  it("returns validation error for schema mismatch", async () => {
    const body = JSON.stringify({ texto_actual: "" });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(req, improveSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("Validacion");
    }
  });
});
