"use client";

import { useState, useEffect } from "react";

/**
 * Template Selector
 *
 * Allows municipality to select a saved template to pre-fill a new project.
 * Shows list of available templates from the organization with preview.
 */

interface Template {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  created_at: string;
  data_snapshot: Record<string, string>;
}

interface TemplateSelectorProps {
  organizationId?: string;
  onApplyTemplate: (data: Record<string, string>) => void;
  onClose: () => void;
}

export function TemplateSelector({
  organizationId,
  onApplyTemplate,
  onClose,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const params = organizationId
          ? `?organization_id=${organizationId}`
          : "";
        const res = await fetch(`/api/templates${params}`);
        if (res.ok) {
          const json = await res.json();
          setTemplates(json.templates ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [organizationId]);

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-sm font-semibold text-text-primary">
          Plantillas de proyectos
        </span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <p className="text-[12px] text-text-muted">Cargando plantillas...</p>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-6">
            <p className="text-[12px] text-text-muted">
              No hay plantillas guardadas. Completa un proyecto y guardalo como plantilla.
            </p>
          </div>
        )}

        {!loading && templates.length > 0 && !selected && (
          <div className="space-y-2">
            {templates.map((t) => {
              const fieldCount = Object.keys(t.data_snapshot).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="w-full text-left rounded-md border border-border p-3 hover:bg-bg-hover transition-colors"
                >
                  <p className="text-[13px] font-medium text-text-primary">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-[11px] text-text-muted line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      {fieldCount} campos
                    </span>
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[9px] text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Preview selected template */}
        {selected && (
          <div className="space-y-3">
            <button
              onClick={() => setSelected(null)}
              className="text-[11px] text-accent hover:text-accent-hover"
            >
              &larr; Volver a la lista
            </button>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">
                {selected.name}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                Esta plantilla pre-llenara {Object.keys(selected.data_snapshot).length} campos.
                Podras editar cualquier campo despues de aplicar.
              </p>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-bg-elevated p-2">
              {Object.entries(selected.data_snapshot)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="py-1.5 border-b border-border last:border-b-0">
                    <p className="text-[10px] font-medium text-text-muted">
                      {key}
                    </p>
                    <p className="text-[11px] text-text-secondary line-clamp-2">
                      {String(value)}
                    </p>
                  </div>
                ))}
              {Object.keys(selected.data_snapshot).length > 5 && (
                <p className="py-1.5 text-[10px] text-text-muted">
                  ... y {Object.keys(selected.data_snapshot).length - 5} campos mas
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onApplyTemplate(selected.data_snapshot);
                  onClose();
                }}
                className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Aplicar plantilla
              </button>
              <button
                onClick={onClose}
                className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
