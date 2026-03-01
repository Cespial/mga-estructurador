import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreProject } from "@/lib/scoring/score-project";

/**
 * GET /api/cron/score-projects
 *
 * Cron endpoint called by Vercel Cron (or any external scheduler).
 * Claims the next pending scoring job and processes it.
 *
 * Expected to be called every 1-5 minutes via vercel.json cron config.
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // ------------------------------------------------------------------
    // Claim next pending job via RPC (atomic operation in Postgres)
    // ------------------------------------------------------------------
    const { data: jobData, error: rpcError } = await supabase.rpc(
      "claim_next_scoring_job",
    );

    if (rpcError) {
      console.error("[cron/score-projects] RPC error:", rpcError.message);
      return NextResponse.json(
        { status: "error", error: rpcError.message },
        { status: 500 },
      );
    }

    // If no pending jobs, return early
    if (!jobData) {
      return NextResponse.json({
        status: "idle",
        message: "No hay trabajos de scoring pendientes.",
      });
    }

    const jobId = typeof jobData === "string" ? jobData : jobData.id ?? jobData;

    console.log(`[cron/score-projects] Procesando job ${jobId}`);

    // ------------------------------------------------------------------
    // Run the scoring pipeline
    // ------------------------------------------------------------------
    await scoreProject(String(jobId));

    console.log(`[cron/score-projects] Job ${jobId} completado exitosamente.`);

    return NextResponse.json({
      status: "completed",
      job_id: jobId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("[cron/score-projects] Error:", message);

    // Try to mark the job as failed if we can extract the job ID
    try {
      // Attempt to find the most recently claimed job and mark it failed
      const { data: failedJobs } = await supabase
        .from("scoring_jobs")
        .select("id")
        .eq("status", "processing")
        .order("claimed_at", { ascending: false })
        .limit(1);

      if (failedJobs && failedJobs.length > 0) {
        await supabase
          .from("scoring_jobs")
          .update({
            status: "failed",
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", failedJobs[0].id);

        // Also mark the project_score as failed
        const { data: job } = await supabase
          .from("scoring_jobs")
          .select("project_score_id")
          .eq("id", failedJobs[0].id)
          .single();

        if (job) {
          await supabase
            .from("project_scores")
            .update({ status: "failed" })
            .eq("id", job.project_score_id);
        }
      }
    } catch (cleanupError) {
      console.error(
        "[cron/score-projects] Error during cleanup:",
        cleanupError,
      );
    }

    return NextResponse.json(
      { status: "failed", error: message },
      { status: 500 },
    );
  }
}
