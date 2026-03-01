import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConvocatoriaDetailClient } from "./detail-client";
import type { RubricCriterion, PuBlitecConvocatoria, Project, Rubric } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConvocatoriaDetailPage({ params }: PageProps) {
  const { id } = await params;

  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch convocatoria with rubric and criteria
  const { data: convocatoria, error } = await supabase
    .from("convocatorias_v2")
    .select(`
      *,
      rubrics_v2 (
        id,
        name,
        total_score,
        created_at,
        rubric_criteria (
          id,
          rubric_id,
          criterion_name,
          max_score,
          weight,
          evaluation_guide,
          sort_order,
          created_at
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !convocatoria) {
    notFound();
  }

  // Fetch projects for this convocatoria
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, status, budget_requested, submitted_at, created_at, organization_id")
    .eq("convocatoria_id", id)
    .order("created_at", { ascending: false });

  const rubric = convocatoria.rubrics_v2?.[0] as (Rubric & { rubric_criteria: RubricCriterion[] }) | undefined;
  const criteria = rubric?.rubric_criteria ?? [];
  const projectList = (projects ?? []) as Project[];

  return (
    <ConvocatoriaDetailClient
      convocatoria={convocatoria as PuBlitecConvocatoria}
      rubric={rubric ?? null}
      criteria={criteria}
      projects={projectList}
    />
  );
}
