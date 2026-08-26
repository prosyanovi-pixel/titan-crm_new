// frontend/src/modules/settings/components/system/enrichment/useBatchEnrich.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EnrichResult, SelectionMap, JobStatus, ENRICH_JOB_KEY } from "./types";

export function useBatchEnrich() {
  const { t } = useTranslation();
  const [jobId, setJobId] = useState<string | null>(() =>
    localStorage.getItem(ENRICH_JOB_KEY),
  );
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [results, setResults] = useState<EnrichResult[]>([]);
  const [selection, setSelection] = useState<SelectionMap>({});
  const [applying, setApplying] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [skipFull, setSkipFull] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoSelect = (res: EnrichResult[]) => {
    const sel: SelectionMap = {};
    for (const r of res) {
      if (r.diff) {
        const changed = Object.entries(r.diff)
          .filter(([, v]) => v.changed)
          .map(([k]) => k);
        if (changed.length) sel[r.contractorId] = new Set(changed);
      }
    }
    setSelection(sel);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.get(`/enrichment/batch-lookup/status/${id}`);
          const freshResults: EnrichResult[] = data.results ?? [];
          setProgress(data.progress ?? 0);
          setTotal(data.total ?? 0);
          setSkipCount(data.skipCount ?? 0);
          setCurrentName(data.currentName ?? null);
          setResults(freshResults);
          setJobStatus(data.status as JobStatus);
          if (freshResults.length > 0) {
            const currentIds = new Set(freshResults.map((r) => r.contractorId));
            setSelection((prev) => {
              const cleaned: SelectionMap = {};
              for (const [idStr, set] of Object.entries(prev)) {
                if (currentIds.has(Number(idStr))) cleaned[Number(idStr)] = set;
              }
              return cleaned;
            });
          }
          if (
            data.status === "done" ||
            data.status === "error" ||
            data.status === "paused"
          ) {
            stopPolling();
            if (data.status === "done" || data.status === "paused")
              autoSelect(data.results ?? []);
            if (data.status === "error")
              toast.error(t("generated.oshibka_zadachi") + data.error);
            if (data.status === "paused")
              toast.info(
                t("generated.zadacha_ostanovlena_nazhmite_prodolzhit"),
              );
          }
        } catch {
          /* сервер недоступен — ждём */
        }
      }, 1500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const savedId = localStorage.getItem(ENRICH_JOB_KEY);
    if (savedId) {
      api
        .get(`/enrichment/batch-lookup/status/${savedId}`)
        .then((data) => {
          setProgress(data.progress ?? 0);
          setTotal(data.total ?? 0);
          setSkipCount(data.skipCount ?? 0);
          setResults(data.results ?? []);
          setJobStatus(data.status as JobStatus);
          setCurrentName(data.currentName ?? null);
          if (data.status === "running" || data.status === "pending") {
            setJobId(savedId);
            startPolling(savedId);
          } else if (data.status === "done" || data.status === "paused") {
            autoSelect(data.results ?? []);
          }
        })
        .catch(() => localStorage.removeItem(ENRICH_JOB_KEY));
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelTracking = () => {
    stopPolling();
    localStorage.removeItem(ENRICH_JOB_KEY);
    setJobId(null);
    setJobStatus("idle");
    setProgress(0);
    setTotal(0);
    setSkipCount(0);
    setCurrentName(null);
    setResults([]);
    setSelection({});
  };

  const run = async () => {
    try {
      const data = await api.post("/enrichment/batch-lookup/start", {
        skipFull,
      });
      if (!data.jobId) {
        toast.error(data.message ?? t('settings.enrichment.no_inn'));
        return;
      }
      localStorage.setItem(ENRICH_JOB_KEY, data.jobId);
      setJobId(data.jobId);
      setJobStatus("pending");
      setProgress(0);
      setTotal(data.total ?? 0);
      setSkipCount(0);
      setResults([]);
      setSelection({});
      setExpandedId(null);
      startPolling(data.jobId);
    } catch (e: unknown) {
      const err = e as {
        status?: number;
        jobId?: string;
        error?: string;
        paused?: boolean;
      };
      if (err.status === 409 && err.jobId) {
        if (err.paused) {
          localStorage.setItem(ENRICH_JOB_KEY, err.jobId);
          setJobId(err.jobId);
          const data = await api.get(
            `/enrichment/batch-lookup/status/${err.jobId}`,
          );
          const res = data.results ?? [];
          setProgress(data.progress ?? 0);
          setTotal(data.total ?? 0);
          setSkipCount(data.skipCount ?? 0);
          setResults(res);
          setJobStatus("paused");
          autoSelect(res);
          toast.info(
            t("generated.est_priostanovlennaya_zadacha_prodolzhit"),
          );
        } else {
          toast.info(
            t("generated.podklyuchaemsya_k_aktivnoy_zadache"),
          );
          localStorage.setItem(ENRICH_JOB_KEY, err.jobId);
          setJobId(err.jobId);
          setJobStatus("running");
          startPolling(err.jobId);
        }
        return;
      }
      if ((err as { status?: number }).status === 409) {
        if (
          confirm(t("generated.v_baze_est_zavisshaya_zadacha_obogaschen"))
        ) {
          await api.post("/enrichment/batch-lookup/reset", {});
          cancelTracking();
          toast.info(t("generated.zadacha_sbroshena_nazhmite_zapustit_snov"));
        }
        return;
      }
      toast.error(
        t("generated.oshibka_zapuska") +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const stopJob = async () => {
    try {
      await api.post("/enrichment/batch-lookup/stop", {});
      stopPolling();
      setJobStatus("paused");
      toast.info(t("generated.zadacha_budet_ostanovlena_posle_tekusche"));
    } catch (e: unknown) {
      toast.error(
        t("generated.oshibka") +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const finishJob = async () => {
    if (!confirm(t("generated.zavershit_zadachu_tekuschie_naydennye_iz")))
      return;
    try {
      await api.post("/enrichment/batch-lookup/finish", {});
      stopPolling();
      setJobStatus("done");
      toast.success(t("generated.zadacha_zavershena_mozhno_sohranit_nayde"));
    } catch (e: unknown) {
      toast.error(
        t("generated.oshibka") +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const continueJob = async () => {
    try {
      const data = await api.post("/enrichment/batch-lookup/continue", {
        skipFull,
      });
      if (!data.jobId) {
        toast.error(data.message ?? t('settings.enrichment.no_task'));
        return;
      }
      setJobStatus("pending");
      setTotal(data.total ?? 0);
      toast.success(t("generated.zadacha_vozobnovlena"));
      startPolling(data.jobId);
    } catch (e: unknown) {
      toast.error(
        t("generated.oshibka") +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const resetJob = async () => {
    if (!confirm(t("generated.sbrosit_zavisshuyu_zadachu_i_zapustit_za")))
      return;
    try {
      await api.post("/enrichment/batch-lookup/reset", {});
      cancelTracking();
      toast.success(t("generated.zadacha_sbroshena"));
    } catch (e: unknown) {
      toast.error(
        t("generated.oshibka_sbrosa") +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  };

  const toggleField = (contractorId: number, field: string) => {
    setSelection((prev) => {
      const n = { ...prev };
      const s = new Set(n[contractorId] ?? []);
      s.has(field) ? s.delete(field) : s.add(field);
      n[contractorId] = s;
      return n;
    });
  };

  const toggleAll = (contractorId: number, fields: string[]) => {
    setSelection((prev) => {
      const s = prev[contractorId] ?? new Set();
      const all = fields.every((f) => s.has(f));
      return {
        ...prev,
        [contractorId]: all ? new Set() : new Set(fields),
      };
    });
  };

  const applySelected = async () => {
    const items: {
      contractorId: number;
      fields: string[];
      source: string;
      data: Record<string, unknown>;
    }[] = [];
    for (const r of results) {
      const fields = Array.from(selection[r.contractorId] ?? []);
      if (fields.length && r.raw)
        items.push({
          contractorId: r.contractorId,
          fields,
          source: r.source ?? "admin-batch",
          data: r.raw,
        });
    }
    if (!items.length) {
      toast.error(t("generated.net_vybrannyh_izmeneniy"));
      return;
    }
    setApplying(true);
    try {
      const res = await api.post("/enrichment/batch-apply", { items });
      const savedCount = items.length;
      let msg = t('settings.system.enrichment.batch.apply_results', { contractors: savedCount, applied: res.applied });
      if (res.errors?.length) {
        msg += t('settings.system.enrichment.batch.apply_errors', { count: res.errors.length });
      }
      toast.success(msg);
      setResults([]);
      setSelection({});
      toast.info(t('settings.enrichment.excluded'));
    } catch (e: unknown) {
      toast.error(
        t("generated.oshibka") +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setApplying(false);
    }
  };

  const withChanges = results.filter((r) => r.changedCount && r.changedCount > 0);
  const withErrors = results.filter((r) => r.error);
  const noChanges = results.filter(
    (r) => !r.error && (!r.changedCount || r.changedCount === 0),
  );
  const totalSelected = withChanges.reduce(
    (s, r) => s + (selection[r.contractorId]?.size ?? 0),
    0,
  );
  const isRunning = jobStatus === "running" || jobStatus === "pending";
  const isPaused = jobStatus === "paused";
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  void jobId; // suppress unused warning

  return {
    t,
    jobStatus,
    progress,
    total,
    skipCount,
    currentName,
    results,
    selection,
    applying,
    expandedId,
    setExpandedId,
    skipFull,
    setSkipFull,
    withChanges,
    withErrors,
    noChanges,
    totalSelected,
    isRunning,
    isPaused,
    pct,
    run,
    stopJob,
    finishJob,
    continueJob,
    resetJob,
    cancelTracking,
    toggleField,
    toggleAll,
    applySelected,
  };
}
