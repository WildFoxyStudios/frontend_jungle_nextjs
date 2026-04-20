"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type ConfigFieldSpec } from "@jungle/api-client";
import {
  Button, Card, CardContent, Input, Label, Switch, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";
import { Eye, EyeOff, Info } from "lucide-react";

/**
 * Catalog-driven settings form.
 *
 * Props:
 *  - `category` — the category name as defined in
 *    `admin-service/src/handlers/config_catalog.rs`. The component fetches
 *    both the catalog and the current values for this category, renders an
 *    input for every field, and persists changes via
 *    `PUT /v1/admin/config/{category}`.
 *
 * Design:
 *  - One source of truth (the backend catalog) means adding a new config
 *    key only requires a single edit on the Rust side.
 *  - Fields are grouped by `field.group` when present.
 *  - Secret fields (`secret: true`) get a show/hide toggle.
 *  - Only modified values are sent on save to keep the diff minimal.
 */
interface CatalogSettingsFormProps {
  category: string;
  /** Optional filter — only render fields whose group matches. */
  groupFilter?: string;
  /** Optional filter — only render a subset of keys. */
  keyFilter?: (field: ConfigFieldSpec) => boolean;
  /** Heading shown above the form. Defaults to the category name. */
  title?: string;
}

export function CatalogSettingsForm({
  category,
  groupFilter,
  keyFilter,
  title,
}: CatalogSettingsFormProps) {
  const queryClient = useQueryClient();

  const catalogQuery = useQuery({
    queryKey: ["admin", "config", "catalog"],
    queryFn: () => adminApi.getConfigCatalog(),
    staleTime: 5 * 60_000,
  });

  const valuesQuery = useQuery({
    queryKey: ["admin", "config", category],
    queryFn: () => adminApi.getConfigCategory(category),
  });

  // Initial and edited values are tracked separately so we can submit only
  // the diff.
  const initialValues = (valuesQuery.data ?? {}) as Record<string, unknown>;
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const fields = useMemo(() => {
    const all = catalogQuery.data?.by_category?.[category] ?? [];
    let filtered = all;
    if (groupFilter) filtered = filtered.filter((f) => f.group === groupFilter);
    if (keyFilter) filtered = filtered.filter(keyFilter);
    return filtered;
  }, [catalogQuery.data, category, groupFilter, keyFilter]);

  const groups = useMemo(() => {
    const out = new Map<string, ConfigFieldSpec[]>();
    for (const f of fields) {
      const g = f.group ?? "";
      if (!out.has(g)) out.set(g, []);
      out.get(g)!.push(f);
    }
    return out;
  }, [fields]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await adminApi.updateConfigCategory(category, edits);
    },
    onSuccess: () => {
      toast.success("Settings saved");
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ["admin", "config", category] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      toast.error(msg);
    },
  });

  const getValue = (f: ConfigFieldSpec): unknown => {
    if (Object.prototype.hasOwnProperty.call(edits, f.key)) return edits[f.key];
    if (Object.prototype.hasOwnProperty.call(initialValues, f.key)) return initialValues[f.key];
    if (f.default !== undefined) {
      if (f.type === "boolean") return f.default === "true";
      if (f.type === "number") return f.default;
      return f.default;
    }
    return f.type === "boolean" ? false : "";
  };

  const setValue = (key: string, value: unknown) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const isLoading = catalogQuery.isLoading || valuesQuery.isLoading;
  const catalogFailed = catalogQuery.isError;
  const hasEdits = Object.keys(edits).length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (catalogFailed) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Failed to load the config catalog. Check that the backend is running and you have
          admin access.
        </CardContent>
      </Card>
    );
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No configurable fields for category <span className="font-mono">{category}</span>
          {groupFilter && <> in group <span className="font-mono">{groupFilter}</span></>}.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {title && <h2 className="font-semibold text-lg">{title}</h2>}

        {Array.from(groups.entries()).map(([group, list]) => (
          <section key={group || "__default"} className="space-y-4">
            {group && (
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {group}
              </h3>
            )}
            <div className="space-y-4">
              {list.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={getValue(field)}
                  revealed={revealed[field.key] ?? false}
                  onToggleReveal={() => setRevealed((p) => ({ ...p, [field.key]: !p[field.key] }))}
                  onChange={(v) => setValue(field.key, v)}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            {hasEdits
              ? `${Object.keys(edits).length} unsaved change(s)`
              : "No unsaved changes"}
          </span>
          <div className="flex gap-2">
            {hasEdits && (
              <Button variant="ghost" onClick={() => setEdits({})}>
                Discard
              </Button>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasEdits || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  field, value, revealed, onToggleReveal, onChange,
}: {
  field: ConfigFieldSpec;
  value: unknown;
  revealed: boolean;
  onToggleReveal: () => void;
  onChange: (v: unknown) => void;
}) {
  const inputId = `config-${field.category}-${field.key}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="font-medium">
          {field.label}
        </Label>
        {field.secret && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
            SECRET
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{field.description}</span>
        </p>
      )}

      {renderInput({ field, value, revealed, onToggleReveal, onChange, inputId })}

      <p className="text-[11px] text-muted-foreground font-mono">
        {field.category}.{field.key}
        {field.default !== undefined && (
          <>
            {" · "}
            <span className="opacity-70">default: {field.default}</span>
          </>
        )}
      </p>
    </div>
  );
}

function renderInput({
  field, value, revealed, onToggleReveal, onChange, inputId,
}: {
  field: ConfigFieldSpec;
  value: unknown;
  revealed: boolean;
  onToggleReveal: () => void;
  onChange: (v: unknown) => void;
  inputId: string;
}) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={inputId}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Enabled" : "Disabled"}
          </span>
        </div>
      );

    case "select":
      return (
        <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={inputId}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "textarea":
    case "json":
      return (
        <textarea
          id={inputId}
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : value == null ? "" : JSON.stringify(value, null, 2)}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <Input
          id={inputId}
          type="number"
          placeholder={field.placeholder}
          value={value == null ? "" : String(value)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return onChange("");
            const n = Number(v);
            onChange(Number.isFinite(n) ? n : v);
          }}
        />
      );

    case "password": {
      const masked = field.secret && !revealed;
      return (
        <div className="relative">
          <Input
            id={inputId}
            type={masked ? "password" : "text"}
            placeholder={field.placeholder}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={onToggleReveal}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={masked ? "Show secret" : "Hide secret"}
          >
            {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      );
    }

    case "media_url":
    case "url":
    case "email":
    case "text":
    default:
      return (
        <Input
          id={inputId}
          type={field.type === "email" ? "email" : field.type === "url" || field.type === "media_url" ? "url" : "text"}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
