// frontend/src/modules/settings/components/EmployeeEditor.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Pencil, UserCheck, UserX, Send } from "lucide-react";
import { getStatuses, getPaymentTypes } from "./employeeEditorHelpers";
import { EmployeeEditorDialog } from "./EmployeeEditorDialog";
import { useEmployeeEditor } from "../hooks/useEmployeeEditor";

const initials = (name?: string | null) =>
  (name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export function EmployeeEditor() {
  const {
    t,
    employees,
    positions,
    departments,
    currencies,
    users,
    contractors,
    loading,
    dialogOpen,
    setDialogOpen,
    editingId,
    form,
    setForm,
    saving,
    filterStatus,
    setFilterStatus,
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
    getStatusInfo,
    filtered,
  } = useEmployeeEditor();

  if (loading)
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t("generated.zagruzka")}
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
        >
          {t('settings.employees.filter_all')} ({employees.length})
        </Button>
        {getStatuses(t).map((s) => {
          const count = employees.filter(
            (e) => e.employment_status === s.value,
          ).length;
          if (!count) return null;
          return (
            <Button
              key={s.value}
              size="sm"
              variant={filterStatus === s.value ? "default" : "outline"}
              onClick={() => setFilterStatus(s.value)}
            >
              {s.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Employee list */}
      <div className="space-y-2">
        {filtered.map((e) => {
          const st = getStatusInfo(e.employment_status);
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-muted/20 group"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={e.user_avatar || ''} alt={e.full_name} />
                <AvatarFallback className="text-xs">
                  {initials(e.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{e.full_name}</span>
                  <Badge variant={st.variant} className="text-[10px] h-4 px-1.5">
                    {st.label}
                  </Badge>
                  {e.user_id ? (
                    <span
                      title={t('settings.employee.account_title', { user_name: e.user_name })}
                      className="flex items-center gap-0.5 text-[10px] text-emerald-600"
                    >
                      <UserCheck className="w-4 h-4" /> {e.user_name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <UserX className="w-4 h-4" /> {t("generated.bez_akkaunta")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  {e.position_name && <span>{e.position_name}</span>}
                  {e.department_name && <span>· {e.department_name}</span>}
                  {e.contractor_name && (
                    <span className="text-blue-600">· {t('settings.employees.contractor_prefix')} {e.contractor_name}</span>
                  )}
                  {e.email_work && <span>· {e.email_work}</span>}
                  {e.telegram_id && (
                    <span className="flex items-center gap-0.5">
                      <Send className="h-2.5 w-2.5" /> {e.telegram_id}
                    </span>
                  )}
                </div>
              </div>
              {e.salary && (
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono">
                    {e.salary_currency_symbol}
                    {Number(e.salary).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {getPaymentTypes(t).find((p) => p.value === e.payment_type)?.label}
                  </div>
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => openEdit(e)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {t("generated.sotrudniki_ne_naydeny")}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full" size="sm" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" />
        {t("generated.dobavit_sotrudnika")}
      </Button>

      <EmployeeEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        positions={positions}
        departments={departments}
        currencies={currencies}
        users={users}
        contractors={contractors}
      />
    </div>
  );
}
