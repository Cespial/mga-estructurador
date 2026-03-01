import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AiAnalyticsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin" || !profile.tenant_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get convocatoria IDs for this tenant
  const { data: convocatorias } = await supabase
    .from("convocatorias")
    .select("id, nombre")
    .eq("tenant_id", profile.tenant_id);

  const convIds = (convocatorias ?? []).map((c) => c.id);

  // Fetch AI interaction metrics from audit_logs
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("action, campo_id, duration_ms, created_at, prompt_hash, sources_used")
    .in("convocatoria_id", convIds.length > 0 ? convIds : ["_none_"])
    .order("created_at", { ascending: false })
    .limit(1000);

  const logs = auditLogs ?? [];

  // Fetch chat message counts
  const { count: totalChatMessages } = await supabase
    .from("ai_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("role", "user");

  // Compute metrics
  const totalInteractions = logs.length;
  const byAction = new Map<string, number>();
  const byCampo = new Map<string, number>();
  const durations: number[] = [];
  const ragUsage = { withRag: 0, withoutRag: 0 };
  const uniquePrompts = new Set<string>();

  for (const log of logs) {
    // By action
    byAction.set(log.action, (byAction.get(log.action) ?? 0) + 1);

    // By campo
    if (log.campo_id) {
      byCampo.set(log.campo_id, (byCampo.get(log.campo_id) ?? 0) + 1);
    }

    // Duration
    if (log.duration_ms) {
      durations.push(log.duration_ms);
    }

    // RAG usage
    const sources = log.sources_used as unknown[];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      ragUsage.withRag++;
    } else {
      ragUsage.withoutRag++;
    }

    // Unique prompts (cache ratio)
    if (log.prompt_hash) {
      uniquePrompts.add(log.prompt_hash);
    }
  }

  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const cacheHitRatio =
    uniquePrompts.size > 0 && totalInteractions > 0
      ? Math.round(
          ((totalInteractions - uniquePrompts.size) / totalInteractions) * 100,
        )
      : 0;

  // Sort by action for display
  const actionEntries = Array.from(byAction.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  // Top campos
  const topCampos = Array.from(byCampo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Interactions last 7 days
  const last7Days = new Map<string, number>();
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    last7Days.set(d.toISOString().slice(0, 10), 0);
  }
  for (const log of logs) {
    const day = log.created_at.slice(0, 10);
    if (last7Days.has(day)) {
      last7Days.set(day, (last7Days.get(day) ?? 0) + 1);
    }
  }

  const dailyData = Array.from(last7Days.entries()).map(([date, count]) => ({
    date,
    label: new Date(date + "T12:00:00").toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
    }),
    count,
  }));

  const maxDaily = Math.max(...dailyData.map((d) => d.count), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            Analytics de IA
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Uso e impacto de las herramientas de inteligencia artificial.
          </p>
        </div>
        <Link
          href="/dashboard/entidad/analytics"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Analytics general
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Interacciones IA
          </p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-text-primary">
            {totalInteractions}
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            {uniquePrompts.size} prompts unicos
          </p>
        </div>

        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Mensajes de Chat
          </p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-accent">
            {totalChatMessages ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            Conversaciones IA
          </p>
        </div>

        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Tiempo promedio
          </p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-text-primary">
            {avgDuration < 1000
              ? `${avgDuration}ms`
              : `${(avgDuration / 1000).toFixed(1)}s`}
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            Latencia respuesta IA
          </p>
        </div>

        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Cache hit ratio
          </p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-emerald-600">
            {cacheHitRatio}%
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            RAG: {ragUsage.withRag} con docs, {ragUsage.withoutRag} sin
          </p>
        </div>
      </div>

      {/* Activity chart (last 7 days) */}
      <div className="card-premium px-5 py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
          Actividad IA — Ultimos 7 dias
        </p>
        <div className="flex items-end gap-2 h-28">
          {dailyData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-text-muted">
                {d.count}
              </span>
              <div
                className="w-full rounded-t-md bg-accent transition-all"
                style={{
                  height: `${Math.max((d.count / maxDaily) * 80, 2)}px`,
                }}
              />
              <span className="text-[9px] text-text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features usage & top campos */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* By feature */}
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
            Uso por feature IA
          </p>
          {actionEntries.length === 0 ? (
            <p className="text-xs text-text-muted">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {actionEntries.map(([action, count]) => {
                const maxCount = actionEntries[0][1];
                const pct = (count / maxCount) * 100;
                return (
                  <div key={action}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-text-secondary">
                        {action}
                      </span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top campos */}
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
            Campos mas consultados
          </p>
          {topCampos.length === 0 ? (
            <p className="text-xs text-text-muted">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topCampos.map(([campo, count], i) => (
                <div
                  key={campo}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/8 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-xs text-text-secondary">
                    {campo}
                  </span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
