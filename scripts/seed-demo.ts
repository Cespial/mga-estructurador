/**
 * Seed script for Polytech demo.
 *
 * Creates demo users, organizations, convocatorias, rubrics, projects,
 * scores, and criteria scores for the Monday demo presentation.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Run with:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-demo.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Wizard form schema (matches DEFAULT_WIZARD_STEPS) ──
const FORM_SCHEMA = [
  {
    step_number: 1,
    step_name: "Identificacion",
    description: "Informacion basica del proyecto y del municipio",
    fields: [
      { id: "project_name", label: "Nombre del Proyecto", type: "text", required: true, placeholder: "Ej: Mejoramiento vial zona rural", aiAssistable: true },
      { id: "municipality", label: "Municipio", type: "text", required: true, placeholder: "Nombre del municipio", aiAssistable: false },
      { id: "department", label: "Departamento", type: "text", required: true, placeholder: "Departamento", aiAssistable: false },
      { id: "sector", label: "Sector", type: "select", required: true, options: ["Infraestructura", "Educacion", "Salud", "Agricultura", "Tecnologia", "Medio Ambiente", "Cultura", "Deporte", "Otro"], aiAssistable: false },
      { id: "problem_description", label: "Descripcion del Problema", type: "textarea", required: true, aiAssistable: true },
      { id: "justification", label: "Justificacion", type: "textarea", required: true, aiAssistable: true },
    ],
  },
  {
    step_number: 2,
    step_name: "Presupuesto",
    description: "Desglose financiero y fuentes de financiacion",
    fields: [
      { id: "total_budget", label: "Presupuesto Total", type: "currency", required: true, aiAssistable: false },
      { id: "own_resources", label: "Recursos Propios", type: "currency", required: false, aiAssistable: false },
      { id: "requested_amount", label: "Monto Solicitado", type: "currency", required: true, aiAssistable: false },
      { id: "other_sources", label: "Otras Fuentes de Financiacion", type: "textarea", required: false, aiAssistable: true },
      { id: "budget_breakdown", label: "Desglose Presupuestal", type: "textarea", required: true, aiAssistable: true },
    ],
  },
  {
    step_number: 3,
    step_name: "Impacto",
    description: "Poblacion beneficiaria, indicadores y resultados esperados",
    fields: [
      { id: "target_population", label: "Poblacion Objetivo", type: "number", required: true, aiAssistable: false },
      { id: "beneficiaries_description", label: "Descripcion de Beneficiarios", type: "textarea", required: true, aiAssistable: true },
      { id: "expected_results", label: "Resultados Esperados", type: "textarea", required: true, aiAssistable: true },
      { id: "sustainability", label: "Sostenibilidad", type: "textarea", required: true, aiAssistable: true },
      { id: "environmental_impact", label: "Impacto Ambiental", type: "textarea", required: false, aiAssistable: true },
    ],
  },
  {
    step_number: 4,
    step_name: "Cronograma",
    description: "Plan de ejecucion y actividades principales",
    fields: [
      { id: "start_date", label: "Fecha de Inicio Propuesta", type: "date", required: true, aiAssistable: false },
      { id: "end_date", label: "Fecha de Finalizacion Propuesta", type: "date", required: true, aiAssistable: false },
      { id: "duration_months", label: "Duracion (meses)", type: "number", required: true, aiAssistable: false },
      { id: "activities", label: "Actividades Principales", type: "textarea", required: true, aiAssistable: true },
      { id: "milestones", label: "Hitos del Proyecto", type: "textarea", required: true, aiAssistable: true },
    ],
  },
  {
    step_number: 5,
    step_name: "Documentos",
    description: "Documentos de soporte y anexos requeridos",
    fields: [
      { id: "technical_document", label: "Documento Tecnico", type: "file", required: false, aiAssistable: false },
      { id: "budget_document", label: "Presupuesto Detallado", type: "file", required: false, aiAssistable: false },
      { id: "support_letters", label: "Cartas de Apoyo", type: "file", required: false, aiAssistable: false },
      { id: "additional_notes", label: "Notas Adicionales", type: "textarea", required: false, aiAssistable: true },
    ],
  },
];

async function createOrGetUser(email: string, password: string, fullName: string) {
  // Try to find existing user first
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`  User ${email} already exists (${found.id})`);
    // Ensure profile exists
    await supabase.from("profiles").upsert({
      id: found.id,
      email,
      full_name: fullName,
      role: "platform_admin",
    }, { onConflict: "id" });
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  console.log(`  Created user ${email} (${data.user.id})`);

  // Create profile
  await supabase.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: "platform_admin",
  }, { onConflict: "id" });

  return data.user.id;
}

async function main() {
  console.log("=== Polytech Demo Seed ===\n");

  // ── 1. Create demo users ──
  console.log("1. Creating demo users...");
  const ideaUserId = await createOrGetUser("demo@idea.gov.co", "Demo2026!", "Carlos Montoya (IDEA)");
  const gobUserId = await createOrGetUser("demo@gobantioquia.gov.co", "Demo2026!", "Ana Maria Restrepo (Gobernacion)");
  const rionUserId = await createOrGetUser("demo@rionegro.gov.co", "Demo2026!", "Juan Pablo Henao (Rionegro)");
  const envigadoUserId = await createOrGetUser("demo@envigado.gov.co", "Demo2026!", "Laura Gomez (Envigado)");
  const bellosUserId = await createOrGetUser("demo@bello.gov.co", "Demo2026!", "Andres Martinez (Bello)");

  // ── 2. Create organizations ──
  console.log("\n2. Creating organizations...");

  const orgs = [
    { owner_id: ideaUserId, name: "IDEA - Instituto para el Desarrollo de Antioquia", type: "entity", nit: "890.980.112-1", department: "Antioquia" },
    { owner_id: gobUserId, name: "Gobernacion de Antioquia", type: "entity", nit: "890.900.286-0", department: "Antioquia" },
    { owner_id: rionUserId, name: "Municipio de Rionegro", type: "municipality", municipality: "Rionegro", department: "Antioquia" },
    { owner_id: envigadoUserId, name: "Municipio de Envigado", type: "municipality", municipality: "Envigado", department: "Antioquia" },
    { owner_id: bellosUserId, name: "Municipio de Bello", type: "municipality", municipality: "Bello", department: "Antioquia" },
  ];

  const orgIds: Record<string, string> = {};
  for (const org of orgs) {
    // Upsert based on owner_id
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", org.owner_id)
      .single();

    if (existingOrg) {
      orgIds[org.name] = existingOrg.id;
      console.log(`  Org "${org.name}" already exists (${existingOrg.id})`);
    } else {
      const { data, error } = await supabase.from("organizations").insert(org).select("id").single();
      if (error) throw new Error(`Failed to create org: ${error.message}`);
      orgIds[org.name] = data.id;
      console.log(`  Created org "${org.name}" (${data.id})`);
    }
  }

  const ideaOrgId = orgIds["IDEA - Instituto para el Desarrollo de Antioquia"];
  const gobOrgId = orgIds["Gobernacion de Antioquia"];
  const rionOrgId = orgIds["Municipio de Rionegro"];
  const envOrgId = orgIds["Municipio de Envigado"];
  const belloOrgId = orgIds["Municipio de Bello"];

  // ── 3. Create convocatorias ──
  console.log("\n3. Creating convocatorias...");

  const convocatorias = [
    {
      organization_id: ideaOrgId,
      name: "Infraestructura Deportiva y Recreativa 2026",
      slug: "infraestructura-deportiva-2026",
      description: "Convocatoria para municipios de Antioquia que buscan mejorar su infraestructura deportiva y recreativa. Financiamos proyectos de construccion, mejoramiento y dotacion de escenarios deportivos.",
      status: "open",
      budget: 5000000000,
      open_date: "2026-02-01T00:00:00Z",
      close_date: "2026-04-30T23:59:59Z",
      form_schema: FORM_SCHEMA,
    },
    {
      organization_id: ideaOrgId,
      name: "Desarrollo Rural Sostenible 2026",
      slug: "desarrollo-rural-2026",
      description: "Programa de apoyo a municipios rurales para proyectos de desarrollo agropecuario sostenible, vias terciarias y conectividad rural.",
      status: "open",
      budget: 8000000000,
      open_date: "2026-01-15T00:00:00Z",
      close_date: "2026-05-15T23:59:59Z",
      form_schema: FORM_SCHEMA,
    },
    {
      organization_id: gobOrgId,
      name: "Transformacion Digital Municipal 2026",
      slug: "transformacion-digital-2026",
      description: "Convocatoria de la Gobernacion de Antioquia para modernizar la gestion publica municipal a traves de herramientas tecnologicas y gobierno digital.",
      status: "open",
      budget: 3000000000,
      open_date: "2026-02-15T00:00:00Z",
      close_date: "2026-06-30T23:59:59Z",
      form_schema: FORM_SCHEMA,
    },
  ];

  const convIds: string[] = [];
  for (const conv of convocatorias) {
    // Check if exists by slug
    const { data: existing } = await supabase
      .from("convocatorias_v2")
      .select("id")
      .eq("slug", conv.slug)
      .single();

    if (existing) {
      convIds.push(existing.id);
      console.log(`  Convocatoria "${conv.name}" already exists (${existing.id})`);
    } else {
      const { data, error } = await supabase.from("convocatorias_v2").insert(conv).select("id").single();
      if (error) throw new Error(`Failed to create convocatoria: ${error.message}`);
      convIds.push(data.id);
      console.log(`  Created convocatoria "${conv.name}" (${data.id})`);
    }
  }

  // ── 4. Create rubrics + criteria ──
  console.log("\n4. Creating rubrics and criteria...");

  const rubricDefs = [
    {
      convocatoria_id: convIds[0],
      name: "Rubrica de Infraestructura Deportiva",
      criteria: [
        { criterion_name: "Pertinencia del Proyecto", max_score: 20, weight: 1.2, evaluation_guide: "Evaluar si el proyecto responde a una necesidad real de la comunidad, si esta alineado con el Plan de Desarrollo Municipal y si tiene impacto directo en la poblacion objetivo.", sort_order: 1 },
        { criterion_name: "Viabilidad Tecnica", max_score: 20, weight: 1.0, evaluation_guide: "Verificar que el proyecto cuenta con estudios tecnicos adecuados, que la solucion propuesta es factible y que los plazos de ejecucion son realistas.", sort_order: 2 },
        { criterion_name: "Estructura Presupuestal", max_score: 15, weight: 1.0, evaluation_guide: "Analizar la coherencia del presupuesto, la relacion costo-beneficio, y la disponibilidad de contrapartidas municipales.", sort_order: 3 },
        { criterion_name: "Impacto Social y Beneficiarios", max_score: 20, weight: 1.3, evaluation_guide: "Evaluar el numero y caracterizacion de beneficiarios directos e indirectos, priorizando poblacion vulnerable, jovenes y adultos mayores.", sort_order: 4 },
        { criterion_name: "Sostenibilidad", max_score: 15, weight: 1.0, evaluation_guide: "Determinar si el municipio tiene capacidad de mantener la infraestructura a largo plazo, incluyendo plan de mantenimiento y operacion.", sort_order: 5 },
        { criterion_name: "Documentacion y Completitud", max_score: 10, weight: 0.8, evaluation_guide: "Verificar que todos los documentos requeridos estan completos, actualizados y cumplen con los requisitos formales de la convocatoria.", sort_order: 6 },
      ],
    },
    {
      convocatoria_id: convIds[1],
      name: "Rubrica de Desarrollo Rural",
      criteria: [
        { criterion_name: "Enfoque Rural y Territorial", max_score: 20, weight: 1.3, evaluation_guide: "Evaluar si el proyecto atiende especificamente problematicas rurales, si considera las particularidades del territorio y si promueve el desarrollo endogeno.", sort_order: 1 },
        { criterion_name: "Sostenibilidad Ambiental", max_score: 20, weight: 1.2, evaluation_guide: "Verificar que el proyecto incorpora practicas sostenibles, minimiza el impacto ambiental y contribuye a la conservacion de los recursos naturales.", sort_order: 2 },
        { criterion_name: "Participacion Comunitaria", max_score: 15, weight: 1.0, evaluation_guide: "Evaluar el nivel de participacion de la comunidad en la formulacion y futura ejecucion del proyecto, incluyendo organizaciones de base.", sort_order: 3 },
        { criterion_name: "Innovacion y Tecnologia Apropiada", max_score: 15, weight: 1.0, evaluation_guide: "Determinar si el proyecto incorpora elementos innovadores o tecnologias apropiadas para el contexto rural.", sort_order: 4 },
        { criterion_name: "Generacion de Empleo e Ingresos", max_score: 15, weight: 1.1, evaluation_guide: "Evaluar la capacidad del proyecto para generar empleo local y mejorar los ingresos de las familias campesinas.", sort_order: 5 },
        { criterion_name: "Capacidad de Ejecucion", max_score: 15, weight: 0.9, evaluation_guide: "Verificar que el municipio cuenta con la capacidad institucional, tecnica y financiera para ejecutar el proyecto.", sort_order: 6 },
      ],
    },
    {
      convocatoria_id: convIds[2],
      name: "Rubrica de Transformacion Digital",
      criteria: [
        { criterion_name: "Nivel de Digitalizacion Actual", max_score: 15, weight: 1.0, evaluation_guide: "Evaluar el diagnostico del estado actual de la gestion digital del municipio y la brecha que busca cerrar el proyecto.", sort_order: 1 },
        { criterion_name: "Impacto en la Gestion Publica", max_score: 20, weight: 1.2, evaluation_guide: "Determinar como el proyecto mejorara la eficiencia, transparencia y calidad del servicio al ciudadano.", sort_order: 2 },
        { criterion_name: "Escalabilidad y Replicabilidad", max_score: 15, weight: 1.0, evaluation_guide: "Evaluar si la solucion propuesta puede escalarse o replicarse en otros municipios.", sort_order: 3 },
        { criterion_name: "Formacion y Capacitacion", max_score: 15, weight: 1.0, evaluation_guide: "Verificar que el proyecto incluye planes de capacitacion para funcionarios y ciudadanos.", sort_order: 4 },
        { criterion_name: "Ciberseguridad y Proteccion de Datos", max_score: 15, weight: 1.1, evaluation_guide: "Evaluar las medidas de seguridad informatica y proteccion de datos personales.", sort_order: 5 },
        { criterion_name: "Presupuesto y Costo-Beneficio", max_score: 20, weight: 1.0, evaluation_guide: "Analizar la eficiencia del gasto propuesto y la relacion entre la inversion y los beneficios esperados.", sort_order: 6 },
      ],
    },
  ];

  const rubricIds: string[] = [];
  const criteriaMap: Record<string, { id: string; criterion_name: string; max_score: number; weight: number }[]> = {};

  for (const rubDef of rubricDefs) {
    // Check existing
    const { data: existingRub } = await supabase
      .from("rubrics_v2")
      .select("id")
      .eq("convocatoria_id", rubDef.convocatoria_id)
      .eq("name", rubDef.name)
      .single();

    let rubricId: string;
    if (existingRub) {
      rubricId = existingRub.id;
      console.log(`  Rubric "${rubDef.name}" already exists (${rubricId})`);
    } else {
      const { data, error } = await supabase
        .from("rubrics_v2")
        .insert({ convocatoria_id: rubDef.convocatoria_id, name: rubDef.name, total_score: 100 })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to create rubric: ${error.message}`);
      rubricId = data.id;
      console.log(`  Created rubric "${rubDef.name}" (${rubricId})`);
    }
    rubricIds.push(rubricId);

    // Insert criteria
    const { data: existingCriteria } = await supabase
      .from("rubric_criteria")
      .select("id, criterion_name, max_score, weight")
      .eq("rubric_id", rubricId);

    if (existingCriteria && existingCriteria.length > 0) {
      criteriaMap[rubricId] = existingCriteria;
      console.log(`  ${existingCriteria.length} criteria already exist`);
    } else {
      const criteriaToInsert = rubDef.criteria.map((c) => ({ ...c, rubric_id: rubricId }));
      const { data: inserted, error } = await supabase
        .from("rubric_criteria")
        .insert(criteriaToInsert)
        .select("id, criterion_name, max_score, weight");
      if (error) throw new Error(`Failed to create criteria: ${error.message}`);
      criteriaMap[rubricId] = inserted;
      console.log(`  Inserted ${inserted.length} criteria`);
    }
  }

  // ── 5. Create projects ──
  console.log("\n5. Creating projects...");

  const projectDefs = [
    // Rionegro → Infraestructura Deportiva (submitted, will be scored)
    {
      convocatoria_id: convIds[0],
      organization_id: rionOrgId,
      title: "Construccion del Polideportivo Comunal Vereda La Ceja",
      description: "Proyecto de construccion de un polideportivo comunal en la vereda La Ceja de Rionegro, con cancha multiuso, zona de juegos infantiles y sendero peatonal.",
      budget_requested: 850000000,
      status: "submitted",
      submitted_at: "2026-02-20T14:30:00Z",
    },
    // Envigado → Infraestructura Deportiva (scored)
    {
      convocatoria_id: convIds[0],
      organization_id: envOrgId,
      title: "Mejoramiento Parque Recreativo El Salado",
      description: "Remodelacion integral del parque recreativo El Salado, incluyendo nuevos juegos inclusivos, iluminacion LED, senderos accesibles y zona de ejercicio al aire libre.",
      budget_requested: 620000000,
      status: "scored",
      submitted_at: "2026-02-18T10:00:00Z",
    },
    // Bello → Infraestructura Deportiva (draft)
    {
      convocatoria_id: convIds[0],
      organization_id: belloOrgId,
      title: "Cancha Sintetica Barrio Niquia",
      description: "Instalacion de cancha de futbol con grama sintetica, graderias y camerinos en el barrio Niquia.",
      budget_requested: 450000000,
      status: "draft",
    },
    // Rionegro → Desarrollo Rural (submitted)
    {
      convocatoria_id: convIds[1],
      organization_id: rionOrgId,
      title: "Programa de Conectividad Rural y Vias Terciarias",
      description: "Mejoramiento de 15 km de vias terciarias e instalacion de 8 puntos de wifi publico en veredas del oriente de Rionegro.",
      budget_requested: 1200000000,
      status: "submitted",
      submitted_at: "2026-02-22T09:15:00Z",
    },
    // Envigado → Desarrollo Rural (scored)
    {
      convocatoria_id: convIds[1],
      organization_id: envOrgId,
      title: "Huertas Comunitarias Urbano-Rurales",
      description: "Creacion de 20 huertas comunitarias en la franja urbano-rural de Envigado, con asistencia tecnica y comercializacion en mercados campesinos.",
      budget_requested: 380000000,
      status: "scored",
      submitted_at: "2026-02-15T16:45:00Z",
    },
    // Rionegro → Transformacion Digital (submitted)
    {
      convocatoria_id: convIds[2],
      organization_id: rionOrgId,
      title: "Plataforma Digital de Tramites Ciudadanos",
      description: "Desarrollo de una plataforma web y movil que permita a los ciudadanos de Rionegro realizar 50+ tramites municipales en linea.",
      budget_requested: 520000000,
      status: "submitted",
      submitted_at: "2026-02-25T11:30:00Z",
    },
    // Bello → Transformacion Digital (draft)
    {
      convocatoria_id: convIds[2],
      organization_id: belloOrgId,
      title: "Sistema de Gestion Documental Inteligente",
      description: "Implementacion de un sistema de gestion documental con IA para la alcaldia de Bello.",
      budget_requested: 280000000,
      status: "draft",
    },
  ];

  const projectIds: string[] = [];
  for (const proj of projectDefs) {
    const { data: existingProj } = await supabase
      .from("projects")
      .select("id")
      .eq("convocatoria_id", proj.convocatoria_id)
      .eq("organization_id", proj.organization_id)
      .eq("title", proj.title)
      .single();

    if (existingProj) {
      projectIds.push(existingProj.id);
      console.log(`  Project "${proj.title.slice(0, 50)}..." already exists (${existingProj.id})`);
    } else {
      const { data, error } = await supabase.from("projects").insert(proj).select("id").single();
      if (error) throw new Error(`Failed to create project "${proj.title}": ${error.message}`);
      projectIds.push(data.id);
      console.log(`  Created project "${proj.title.slice(0, 50)}..." (${data.id})`);
    }
  }

  // ── 6. Create project forms for submitted/scored projects ──
  console.log("\n6. Creating project forms...");

  const formDataSets: Record<number, Record<string, unknown>[]> = {
    // Project 0: Rionegro Polideportivo (submitted)
    0: [
      { project_name: "Construccion del Polideportivo Comunal Vereda La Ceja", municipality: "Rionegro", department: "Antioquia", sector: "Deporte", problem_description: "La vereda La Ceja de Rionegro cuenta con 3,500 habitantes y no dispone de un escenario deportivo adecuado. Los jovenes practican deporte en una cancha sin pavimentar que se inunda en epoca de lluvias, generando problemas de seguridad y limitando la practica deportiva organizada.", justification: "El proyecto es prioritario dentro del Plan de Desarrollo Municipal 2024-2027 'Rionegro Avanza'. La construccion del polideportivo beneficiara a 12 veredas del sector oriental, reducira indices de sedentarismo juvenil y fortalecera el tejido social comunitario." },
      { total_budget: 1050000000, own_resources: 200000000, requested_amount: 850000000, other_sources: "Recursos de regalias - SGR Antioquia: $200,000,000 como contrapartida municipal.", budget_breakdown: "Obra civil y cimentacion: $380,000,000\nCubierta y estructura metalica: $220,000,000\nCancha multiuso (piso sintetico): $150,000,000\nZona de juegos infantiles: $80,000,000\nIluminacion LED: $60,000,000\nSendero peatonal y zonas verdes: $70,000,000\nEstudios y disenos: $40,000,000\nInterventoria: $50,000,000" },
      { target_population: 8500, beneficiaries_description: "Poblacion directa: 3,500 habitantes de la vereda La Ceja. Poblacion indirecta: 5,000 habitantes de las veredas aledanas (El Capiro, San Antonio, Pontezuela). Priorizacion: 40% jovenes (14-28 anos), 25% ninos (5-13 anos), 20% adultos, 15% adultos mayores.", expected_results: "1. Polideportivo construido y en operacion con capacidad para 500 personas\n2. 15 escuelas deportivas creadas en 5 disciplinas\n3. Reduccion del 30% en indices de sedentarismo juvenil\n4. 50+ eventos deportivos y culturales anuales\n5. 12 veredas conectadas por circuito deportivo", sustainability: "El municipio de Rionegro asignara $80 millones anuales para mantenimiento y operacion del polideportivo. Se creara una junta administradora comunitaria con representacion de las 12 veredas. Los ingresos por alquiler de escenarios cubriran el 40% de los costos operativos.", environmental_impact: "Impacto ambiental bajo. Se realizara compensacion forestal con siembra de 200 arboles nativos. El diseno incluye recoleccion de aguas lluvias y paneles solares para iluminacion parcial." },
      { start_date: "2026-07-01", end_date: "2027-12-31", duration_months: 18, activities: "Mes 1-2: Estudios y disenos definitivos\nMes 3-4: Licencias y permisos\nMes 5-8: Cimentacion y obra civil\nMes 9-12: Estructura metalica y cubierta\nMes 13-15: Acabados, cancha sintetica e iluminacion\nMes 16-17: Zona de juegos y senderos\nMes 18: Pruebas, inauguracion y apertura", milestones: "Hito 1: Estudios aprobados - Mes 2\nHito 2: Cimentacion completada - Mes 8\nHito 3: Estructura y cubierta terminada - Mes 12\nHito 4: Cancha sintetica instalada - Mes 15\nHito 5: Inauguracion - Mes 18" },
      { additional_notes: "El proyecto cuenta con el respaldo unanime del Concejo Municipal de Rionegro (Acuerdo 045 de 2025). La vereda La Ceja fue priorizada en el presupuesto participativo 2025 con 2,800 votos ciudadanos." },
    ],
    // Project 1: Envigado Parque El Salado (scored)
    1: [
      { project_name: "Mejoramiento Parque Recreativo El Salado", municipality: "Envigado", department: "Antioquia", sector: "Deporte", problem_description: "El parque recreativo El Salado, principal espacio deportivo de la comuna 5, presenta deterioro avanzado tras 15 anos sin intervencion mayor. Los juegos infantiles no cumplen normas de seguridad, la iluminacion es deficiente y no cuenta con accesibilidad para personas con discapacidad.", justification: "El Salado es utilizado diariamente por 2,000+ personas. La remodelacion es urgente para prevenir accidentes (12 reportados en 2025), cumplir con normatividad de accesibilidad universal y revitalizar el espacio como punto de encuentro comunitario." },
      { total_budget: 780000000, own_resources: 160000000, requested_amount: 620000000, budget_breakdown: "Juegos infantiles inclusivos: $180,000,000\nIluminacion LED inteligente: $95,000,000\nSenderos accesibles y rampas: $85,000,000\nZona de ejercicio al aire libre: $75,000,000\nMobiliario urbano: $60,000,000\nPaisajismo y zonas verdes: $55,000,000\nSistema de drenaje: $70,000,000\nEstudios y disenos: $60,000,000\nInterventoria: $50,000,000\nImprevistos: $50,000,000" },
      { target_population: 15000, beneficiaries_description: "Poblacion directa: 8,000 habitantes de la comuna 5 de Envigado. Poblacion indirecta: 7,000 visitantes semanales de otras comunas y municipios. Se prioriza: personas con discapacidad (800+), primera infancia (2,500), adultos mayores (1,200).", expected_results: "1. 100% del parque remodelado con accesibilidad universal\n2. Reduccion a cero de accidentes por infraestructura\n3. Incremento del 50% en visitantes diarios\n4. 5 zonas tematicas (infantil, juvenil, adulto mayor, fitness, contemplacion)\n5. Clasificacion como Parque Inclusivo certificado", sustainability: "Envigado destina $120 millones anuales al mantenimiento de parques. Se incorporara al programa 'Parques con Corazon' que ya mantiene 45 parques municipales. Operacion a cargo de INDER Envigado.", environmental_impact: "Positivo: siembra de 150 arboles nativos, sistema de riego con aguas recicladas, iluminacion solar parcial. Cero tala de arboles existentes." },
      { start_date: "2026-06-01", end_date: "2027-06-30", duration_months: 12, activities: "Mes 1-2: Disenos participativos con comunidad\nMes 3-4: Demolicion selectiva y preparacion\nMes 5-7: Obra civil, drenajes y senderos\nMes 8-9: Instalacion juegos y equipos fitness\nMes 10-11: Paisajismo e iluminacion\nMes 12: Pruebas y apertura", milestones: "Hito 1: Disenos aprobados con comunidad - Mes 2\nHito 2: Obra civil terminada - Mes 7\nHito 3: Juegos instalados - Mes 9\nHito 4: Inauguracion - Mes 12" },
      { additional_notes: "Proyecto priorizado en el Plan de Desarrollo Municipal 'Envigado Contigo 2024-2027'. Cuenta con carta de apoyo de 5 JAC y la Asociacion de Personas con Discapacidad de Envigado." },
    ],
    // Project 3: Rionegro Conectividad Rural (submitted)
    3: [
      { project_name: "Programa de Conectividad Rural y Vias Terciarias", municipality: "Rionegro", department: "Antioquia", sector: "Infraestructura", problem_description: "Las veredas del oriente de Rionegro (15 veredas, 12,000 habitantes) sufren de vias terciarias en mal estado que se vuelven intransitables en epoca de lluvias, y carecen de conectividad a internet, limitando el acceso a educacion virtual, telemedicina y comercializacion de productos agropecuarios.", justification: "El mejoramiento vial reduce tiempos de transporte en 60%, disminuye costos de transporte de productos agricolas y mejora el acceso a servicios de salud. La conectividad WiFi permite acceso a educacion virtual para 2,800 jovenes rurales." },
      { total_budget: 1500000000, own_resources: 300000000, requested_amount: 1200000000, budget_breakdown: "Mejoramiento vias terciarias (15km): $800,000,000\nPuntos WiFi publico (8 puntos): $160,000,000\nEquipos de red y antenas: $120,000,000\nObras de drenaje vial: $100,000,000\nSenalizacion: $40,000,000\nEstudios y topografia: $80,000,000\nInterventoria: $100,000,000\nImprevistos: $100,000,000" },
      { target_population: 12000, beneficiaries_description: "12,000 habitantes rurales de 15 veredas. Productores agropecuarios (3,000), estudiantes rurales (2,800), adultos mayores que requieren acceso a salud (1,500).", expected_results: "1. 15 km de vias mejoradas (placa huella y cunetas)\n2. 8 puntos WiFi de acceso publico gratuito\n3. Reduccion del 60% en tiempo de desplazamiento\n4. 2,800 estudiantes con acceso a educacion virtual\n5. 15 centros de acopio conectados a plataformas de comercializacion", sustainability: "Mantenimiento vial: $100M anuales del presupuesto municipal. Conectividad: convenio con operador de telecomunicaciones para mantenimiento de equipos por 5 anos." },
      { start_date: "2026-08-01", end_date: "2028-01-31", duration_months: 18, activities: "Mes 1-3: Topografia y disenos viales\nMes 4-12: Construccion placa huella (3 frentes)\nMes 6-9: Instalacion puntos WiFi\nMes 10-15: Obras de drenaje y complementarias\nMes 16-18: Senalizacion y pruebas", milestones: "Hito 1: 5km completados - Mes 8\nHito 2: 8 puntos WiFi activos - Mes 9\nHito 3: 15km completados - Mes 15\nHito 4: Entrega final - Mes 18" },
      { additional_notes: "Proyecto articulado con el Plan Vial Departamental de Antioquia. Cuenta con aval del Comite de Vias del Oriente Antioqueno." },
    ],
    // Project 4: Envigado Huertas (scored)
    4: [
      { project_name: "Huertas Comunitarias Urbano-Rurales", municipality: "Envigado", department: "Antioquia", sector: "Agricultura", problem_description: "La franja urbano-rural de Envigado (veredas Perico, El Escobero, Las Palmas) enfrenta perdida progresiva de vocacion agropecuaria. Los jovenes rurales migran a la ciudad y no hay cadenas de comercializacion para pequenos productores.", justification: "Las huertas comunitarias fortalecen la seguridad alimentaria, generan empleo rural, preservan saberes campesinos y crean cadenas cortas de comercializacion a traves de mercados campesinos. Envigado tiene demanda probada: sus mercados campesinos atraen 5,000 visitantes semanales." },
      { total_budget: 480000000, own_resources: 100000000, requested_amount: 380000000, budget_breakdown: "Adecuacion de 20 terrenos: $100,000,000\nSistemas de riego por goteo: $60,000,000\nInsumos y semillas organicas: $40,000,000\nInvernaderos comunitarios (10): $80,000,000\nCapacitacion tecnica (200 familias): $50,000,000\nApp de comercializacion: $30,000,000\nEquipo tecnico (2 anos): $80,000,000\nEventos de mercado campesino: $20,000,000\nImprevistos: $20,000,000" },
      { target_population: 4000, beneficiaries_description: "200 familias campesinas directas (800 personas). 3,200 consumidores de mercados campesinos. Priorizacion: mujeres cabeza de hogar (60%), jovenes rurales (25%), adultos mayores (15%).", expected_results: "1. 20 huertas comunitarias produciendo\n2. 200 familias capacitadas en agricultura organica\n3. 10 invernaderos operativos\n4. App de comercializacion con 50+ productos\n5. 24 mercados campesinos anuales\n6. $200M en ingresos anuales para familias", sustainability: "Las huertas se sostienen con la venta de productos. La UMATA de Envigado brindara acompanamiento tecnico permanente. Los mercados campesinos generan ingresos que cubren costos operativos.", environmental_impact: "Altamente positivo: agricultura organica, cero agroquimicos, compostaje de residuos organicos, preservacion de semillas nativas." },
      { start_date: "2026-05-01", end_date: "2028-04-30", duration_months: 24, activities: "Mes 1-3: Seleccion de terrenos y familias\nMes 4-6: Adecuacion de terrenos y riego\nMes 7-9: Siembras iniciales y capacitacion\nMes 10-12: Instalacion invernaderos\nMes 13-18: Produccion y primeros mercados\nMes 19-24: Consolidacion y expansion", milestones: "Hito 1: 20 terrenos adecuados - Mes 6\nHito 2: Primera cosecha - Mes 10\nHito 3: App lanzada - Mes 12\nHito 4: 200 familias produciendo - Mes 18" },
      { additional_notes: "Articulado con el programa 'Envigado Rural' de la alcaldia. Cuenta con convenio marco con el SENA para formacion tecnica." },
    ],
    // Project 5: Rionegro Plataforma Digital (submitted)
    5: [
      { project_name: "Plataforma Digital de Tramites Ciudadanos", municipality: "Rionegro", department: "Antioquia", sector: "Tecnologia", problem_description: "Los ciudadanos de Rionegro deben desplazarse fisicamente a la alcaldia para realizar tramites, generando filas de 2+ horas, perdida de productividad y baja satisfaccion ciudadana. Solo 8 de 120 tramites estan disponibles en linea.", justification: "La digitalizacion de tramites mejora la eficiencia del gobierno, reduce costos de atencion, aumenta la transparencia y permite acceso 24/7 a servicios publicos. Colombia tiene la meta de 80% de tramites digitales para 2027 (Politica de Gobierno Digital)." },
      { total_budget: 680000000, own_resources: 160000000, requested_amount: 520000000, budget_breakdown: "Desarrollo plataforma web: $200,000,000\nDesarrollo app movil: $120,000,000\nInfraestructura cloud (2 anos): $80,000,000\nCapacitacion funcionarios (200): $50,000,000\nCiberseguridad y auditorias: $40,000,000\nIntegracion con PQRSD y SECOP: $50,000,000\nCampana de adopcion ciudadana: $30,000,000\nSoporte tecnico (2 anos): $60,000,000\nImprevistos: $50,000,000" },
      { target_population: 130000, beneficiaries_description: "130,000 ciudadanos de Rionegro (toda la poblacion). 200 funcionarios publicos. Priorizacion: poblacion rural (32,000) que mas se beneficia de no desplazarse.", expected_results: "1. Plataforma con 50+ tramites en linea\n2. App movil para iOS y Android\n3. Reduccion del 70% en tiempo de tramites\n4. 60% de adopcion ciudadana en primer ano\n5. 200 funcionarios capacitados\n6. Integracion con 5 sistemas nacionales", sustainability: "La plataforma se sostiene con el presupuesto de TIC de la alcaldia ($150M anuales). Se formara un equipo interno de soporte. El ahorro en atencion presencial ($200M/ano) justifica la inversion.", environmental_impact: "Positivo: reduccion del 40% en uso de papel. Reduccion de desplazamientos vehiculares a la alcaldia." },
      { start_date: "2026-09-01", end_date: "2027-08-31", duration_months: 12, activities: "Mes 1-2: Levantamiento de requerimientos\nMes 3-6: Desarrollo plataforma web\nMes 5-8: Desarrollo app movil\nMes 6-8: Integraciones y ciberseguridad\nMes 9-10: Capacitacion funcionarios\nMes 11-12: Piloto y lanzamiento", milestones: "Hito 1: Prototipo aprobado - Mes 2\nHito 2: Plataforma web beta - Mes 6\nHito 3: App movil beta - Mes 8\nHito 4: Lanzamiento publico - Mes 12" },
      { additional_notes: "Proyecto alineado con la Politica de Gobierno Digital (Decreto 767 de 2022). Rionegro fue seleccionado como municipio piloto de gobierno digital por MinTIC en 2025." },
    ],
  };

  // Insert forms for submitted/scored projects
  const submittedOrScored = [0, 1, 3, 4, 5]; // project indices
  for (const projIdx of submittedOrScored) {
    const projectId = projectIds[projIdx];
    const formData = formDataSets[projIdx];
    if (!formData) continue;

    const stepNames = ["Identificacion", "Presupuesto", "Impacto", "Cronograma", "Documentos"];

    for (let stepNum = 0; stepNum < formData.length; stepNum++) {
      const { data: existingForm } = await supabase
        .from("project_forms")
        .select("id")
        .eq("project_id", projectId)
        .eq("step_number", stepNum + 1)
        .single();

      if (existingForm) {
        console.log(`  Form step ${stepNum + 1} for project ${projIdx} already exists`);
        continue;
      }

      const { error } = await supabase.from("project_forms").insert({
        project_id: projectId,
        step_number: stepNum + 1,
        step_name: stepNames[stepNum],
        form_data: formData[stepNum],
        completed: true,
      });
      if (error) console.error(`  Error inserting form step ${stepNum + 1} for project ${projIdx}: ${error.message}`);
    }
    console.log(`  Inserted ${formData.length} form steps for project "${projectDefs[projIdx].title.slice(0, 40)}..."`);
  }

  // ── 7. Create scores for "scored" projects ──
  console.log("\n7. Creating project scores and criteria scores...");

  const scoredProjects = [
    { projectIdx: 1, rubricIdx: 0, convIdx: 0 }, // Envigado Parque → Infra Deportiva rubric
    { projectIdx: 4, rubricIdx: 1, convIdx: 1 }, // Envigado Huertas → Desarrollo Rural rubric
  ];

  for (const sp of scoredProjects) {
    const projectId = projectIds[sp.projectIdx];
    const rubricId = rubricIds[sp.rubricIdx];
    const criteria = criteriaMap[rubricId];

    // Check existing score
    const { data: existingScore } = await supabase
      .from("project_scores")
      .select("id")
      .eq("project_id", projectId)
      .eq("rubric_id", rubricId)
      .single();

    let scoreId: string;
    if (existingScore) {
      scoreId = existingScore.id;
      console.log(`  Score for project ${sp.projectIdx} already exists (${scoreId})`);
      continue; // Skip criteria insertion too
    }

    // Create scores with realistic values
    const scoreValues = sp.projectIdx === 1
      ? [17, 16, 13, 18, 13, 8]  // Envigado Parque: 85/100 total
      : [18, 17, 14, 12, 13, 12]; // Envigado Huertas: 86/100 total

    const criteriaScores = criteria.map((c, i) => ({
      score: scoreValues[i] ?? Math.round(c.max_score * 0.8),
      max_score: c.max_score,
      weight: c.weight,
      weighted_score: scoreValues[i] * c.weight,
      rubric_criteria_id: c.id,
    }));

    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const totalWeighted = criteriaScores.reduce((sum, cs) => sum + cs.weighted_score, 0);

    const { data: scoreData, error: scoreErr } = await supabase
      .from("project_scores")
      .insert({
        project_id: projectId,
        rubric_id: rubricId,
        evaluator_type: "ai",
        total_score: totalScore,
        total_weighted_score: totalWeighted,
        ai_summary: sp.projectIdx === 1
          ? "El proyecto de mejoramiento del Parque El Salado presenta una formulacion solida con alta pertinencia social. Se destaca por su enfoque inclusivo y la priorizacion de poblacion con discapacidad. El presupuesto esta bien estructurado aunque podria detallarse mas la intervencion de drenajes. El impacto social es significativo: beneficia a 15,000 personas directa e indirectamente. Se recomienda fortalecer el plan de mantenimiento post-obra y detallar indicadores de medicion de impacto. Puntaje general: 85/100."
          : "El proyecto de Huertas Comunitarias demuestra un enfoque rural innovador con alto potencial de sostenibilidad. La participacion comunitaria y el enfoque de genero son ejemplares. La tecnologia apropiada (riego por goteo, invernaderos) es adecuada para el contexto. Se recomienda precisar los canales de comercializacion y fortalecer alianzas con universidades para investigacion en semillas nativas. Puntaje general: 86/100.",
        status: "completed",
      })
      .select("id")
      .single();

    if (scoreErr) throw new Error(`Failed to create score: ${scoreErr.message}`);
    scoreId = scoreData.id;
    console.log(`  Created score for project ${sp.projectIdx} (${scoreId}): ${totalScore}pts`);

    // Insert criteria scores
    const justifications = sp.projectIdx === 1
      ? [
          "El proyecto responde directamente a una necesidad documentada con 12 accidentes reportados. Esta alineado con el Plan de Desarrollo Municipal y prioriza poblacion vulnerable.",
          "Los disenos participativos son un punto fuerte. Sin embargo, el cronograma de 12 meses es ajustado para la complejidad de la intervencion. Recomendable incluir contingencia temporal.",
          "El presupuesto es coherente aunque el rubro de drenaje ($70M) podria requerir ajuste tras estudios de suelo. La contrapartida municipal del 20% es adecuada.",
          "Excelente priorizacion de poblacion con discapacidad y primera infancia. El impacto en 15,000 personas es significativo para la inversion. Indicadores SMART bien definidos.",
          "El programa 'Parques con Corazon' de INDER Envigado es una garantia solida. Los $120M anuales de mantenimiento son realistas para la escala del parque.",
          "Documentacion completa con cartas de apoyo de 5 JAC. Falta certificado de tradicion del predio y estudio de suelos actualizado.",
        ]
      : [
          "Excelente enfoque territorial que atiende la problematica de despoblamiento rural. La articulacion con mercados campesinos existentes fortalece la propuesta.",
          "Agricultura organica sin agroquimicos, compostaje y preservacion de semillas nativas. El impacto ambiental es claramente positivo y bien documentado.",
          "Participacion ejemplar: 60% mujeres cabeza de hogar, alianza con SENA y UMATA. Procesos de seleccion de familias transparentes y con enfoque de genero.",
          "La app de comercializacion es innovadora pero necesita mayor detalle tecnico. Los invernaderos comunitarios son tecnologia apropiada para el contexto.",
          "Los mercados campesinos generan ingresos reales ($200M anuales estimados). El modelo de auto-sostenimiento es creible con el historial de mercados en Envigado.",
          "Buen equipo tecnico propuesto pero el cronograma de 24 meses podria acortarse. La UMATA garantiza acompanamiento pero su capacidad actual podria saturarse.",
        ];

    const criteriaInserts = criteriaScores.map((cs, i) => ({
      project_score_id: scoreId,
      rubric_criteria_id: cs.rubric_criteria_id,
      score: cs.score,
      max_score: cs.max_score,
      weight: cs.weight,
      weighted_score: cs.weighted_score,
      justification: justifications[i],
      ai_rationale: `Analisis automatico basado en la informacion del formulario y los criterios de la rubrica. Modelo: claude-sonnet-4-6.`,
    }));

    const { error: csErr } = await supabase.from("criteria_scores").insert(criteriaInserts);
    if (csErr) throw new Error(`Failed to insert criteria scores: ${csErr.message}`);
    console.log(`  Inserted ${criteriaInserts.length} criteria scores`);

    // Create completed scoring job
    const { error: jobErr } = await supabase.from("scoring_jobs").insert({
      project_score_id: scoreId,
      engine_version: "v1",
      config: { model: "claude-sonnet-4-6" },
      status: "completed",
      claimed_at: new Date(Date.now() - 3600000).toISOString(),
      started_at: new Date(Date.now() - 3500000).toISOString(),
      completed_at: new Date(Date.now() - 3200000).toISOString(),
    });
    if (jobErr) console.error(`  Error creating scoring job: ${jobErr.message}`);
    else console.log(`  Created completed scoring job`);
  }

  // ── 8. Summary ──
  console.log("\n=== SEED COMPLETE ===\n");
  console.log("Demo Credentials:");
  console.log("  ENTITY (IDEA):        demo@idea.gov.co / Demo2026!");
  console.log("  ENTITY (Gobernacion): demo@gobantioquia.gov.co / Demo2026!");
  console.log("  MUNICIPALITY (Rionegro): demo@rionegro.gov.co / Demo2026!");
  console.log("  MUNICIPALITY (Envigado): demo@envigado.gov.co / Demo2026!");
  console.log("  MUNICIPALITY (Bello):    demo@bello.gov.co / Demo2026!");
  console.log("\nConvocatorias:");
  convIds.forEach((id, i) => console.log(`  ${convocatorias[i].name}: ${id}`));
  console.log("\nProjects:");
  projectIds.forEach((id, i) => console.log(`  ${projectDefs[i].title.slice(0, 50)}: ${id} [${projectDefs[i].status}]`));
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
