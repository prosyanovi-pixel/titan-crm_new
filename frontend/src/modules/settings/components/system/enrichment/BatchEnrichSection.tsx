// frontend/src/modules/settings/components/system/enrichment/BatchEnrichSection.tsx
import React from "react";
import { Sparkles, RefreshCw, X, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBatchEnrich } from "./useBatchEnrich";

export function BatchEnrichSection() {
  const {
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
  } = useBatchEnrich();

  return (
    <div className="space-y-4">
      {/* Controls card */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox
                checked={skipFull}
                onCheckedChange={(v) => setSkipFull(v === true)}
                disabled={isRunning}
              />
              <span>{t("generated.propuskat_zapolnennyh_6_iz_8_poley")}</span>
            </label>
            {!skipFull && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                {t("generated.budut_provereny_vse_vklyuchaya_ranee_obo")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={run} disabled={isRunning || isPaused} className="gap-2">
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isRunning ? t('settings.system.enrichment.batch.running_status') : t('settings.system.enrichment.batch.run_button')}
            </Button>

            {isPaused && (
              <>
                <Button onClick={continueJob} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <RefreshCw className="w-4 h-4" /> {t('settings.system.enrichment.batch.continue_button')} ({progress}/{total})
                </Button>
                <Button variant="outline" size="sm" onClick={finishJob}
                  className="gap-1 text-emerald-700 border-emerald-400 hover:bg-emerald-50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("generated.zavershit_i_sohranit_naydennoe")}
                </Button>
                <Button variant="outline" size="sm" onClick={cancelTracking}
                  className="gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" /> {t("generated.otmena_ochistit")}
                </Button>
              </>
            )}

            {isRunning && (
              <>
                <Button variant="outline" size="sm" onClick={stopJob}
                  className="gap-1 text-orange-600 border-orange-400 hover:bg-orange-50">
                  <X className="w-3.5 h-3.5" /> {t("generated.ostanovit")}
                </Button>
                <Button variant="outline" size="sm" onClick={cancelTracking}
                  className="gap-1 text-muted-foreground">
                  {t("generated.skryt")}
                </Button>
                <Button variant="outline" size="sm" onClick={resetJob}
                  className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10">
                  <RefreshCw className="w-3.5 h-3.5" /> {t("generated.sbrosit_i_zapustit_zanovo")}
                </Button>
              </>
            )}

            {(jobStatus === "done" || jobStatus === "paused") && results.length > 0 && (
              <Button onClick={applySelected} disabled={applying || totalSelected === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {applying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {t('settings.system.enrichment.batch.save_selected')} ({totalSelected})
              </Button>
            )}

            {jobStatus === "done" && results.length > 0 && (
              <Button variant="outline" size="sm" onClick={cancelTracking}
                className="gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> {t("generated.ochistit")}
              </Button>
            )}

            {total > 0 && !isRunning && (
              <span className="text-sm text-muted-foreground ml-auto">
                {t('settings.system.enrichment.batch.processed')}: {progress - skipCount}/{total} · {t('settings.system.enrichment.batch.skipped')}: {skipCount} ·
                {t('settings.system.enrichment.batch.changes')}: {withChanges.length} · {t('settings.system.enrichment.batch.errors')}: {withErrors.length}
              </span>
            )}
          </div>

          {isRunning && total > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {currentName ? `${t('settings.system.enrichment.batch.processing')} ${currentName}` : t('settings.system.enrichment.batch.preparing')}
                </span>
                <span>
                  {progress} / {total} ({pct}%)
                  {skipCount > 0 ? ` · ${t('settings.system.enrichment.batch.skipped_lower')} ${skipCount}` : ""}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {withErrors.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {t('settings.system.enrichment.batch.error_title')} ({withErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {withErrors.map((r) => (
                <div key={r.contractorId} className="text-sm flex gap-2">
                  <span className="font-medium w-40 truncate">{r.name}</span>
                  <span className="text-muted-foreground">{r.inn}</span>
                  <span className="text-destructive">{r.error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changes table */}
      {withChanges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t('settings.system.enrichment.batch.found_changes')} ({withChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("generated.kontragent")}</TableHead>
                  <TableHead>{t("generated.inn")}</TableHead>
                  <TableHead>{t("generated.istochnik")}</TableHead>
                  <TableHead className="text-center">{t("generated.poley")}</TableHead>
                  <TableHead className="w-24">{t("generated.vybrano")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withChanges.map((r) => {
                  const changedFields = Object.entries(r.diff ?? {})
                    .filter(([, v]) => v.changed)
                    .map(([k]) => k);
                  const selectedCount = selection[r.contractorId]?.size ?? 0;
                  const isExpanded = expandedId === r.contractorId;
                  return (
                    <React.Fragment key={r.contractorId}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : r.contractorId)
                        }
                      >
                        <TableCell>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform text-muted-foreground ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.inn}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{r.changedCount}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                selectedCount === changedFields.length &&
                                selectedCount > 0
                              }
                              onCheckedChange={() =>
                                toggleAll(r.contractorId, changedFields)
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {selectedCount}/{changedFields.length}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${r.contractorId}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              {Object.entries(r.diff ?? {})
                                .filter(([, v]) => v.changed)
                                .map(([field, v]) => (
                                  <div
                                    key={field}
                                    className="flex items-start gap-3 text-sm"
                                  >
                                    <Checkbox
                                      checked={
                                        selection[r.contractorId]?.has(field) ??
                                        false
                                      }
                                      onCheckedChange={() =>
                                        toggleField(r.contractorId, field)
                                      }
                                    />
                                    <span className="w-36 font-medium text-muted-foreground shrink-0">
                                      {v.label}
                                    </span>
                                    <span className="line-through text-muted-foreground/70 w-64 truncate">
                                      {v.current || "—"}
                                    </span>
                                    <span className="text-emerald-600 font-medium truncate">
                                      {v.fetched || "—"}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {jobStatus === "done" &&
        withChanges.length === 0 &&
        withErrors.length === 0 &&
        results.length === 0 &&
        noChanges.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-60" />
              {t("generated.vse_dannye_aktual_ny_izmeneniy_ne_nayden")}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
