// frontend/src/modules/settings/components/EmployeeEditorDialog.tsx
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Send, Cake, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getStatuses,
  getPaymentTypes,
  type Position,
  type Department,
  type EmployeeCurrency,
  type EmployeeUser,
  type EmployeeContractor,
  type EmployeeForm,
} from "./employeeEditorHelpers";
import { useState } from "react";

interface EmployeeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: number | null;
  form: EmployeeForm;
  setForm: React.Dispatch<React.SetStateAction<EmployeeForm>>;
  saving: boolean;
  onSave: () => void;
  positions: Position[];
  departments: Department[];
  currencies: EmployeeCurrency[];
  users: EmployeeUser[];
  contractors: EmployeeContractor[];
}

export function EmployeeEditorDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  saving,
  onSave,
  positions,
  departments,
  currencies,
  users,
  contractors,
}: EmployeeEditorDialogProps) {
  const { t } = useTranslation();
  const set = <K extends keyof EmployeeForm>(k: K, v: EmployeeForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? t("settings.employees.edit_employee") : t("settings.employees.new_employee")}
          </DialogTitle>
          <DialogDescription>
            {editingId ? t("general.generated.izmenite_informatsiyu_o_sotrudnike") : t("general.generated.dobavte_novogo_sotrudnika_v_bazu")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">{t("generated.lichnye_dannye")}</TabsTrigger>
            <TabsTrigger value="work">{t("generated.dolzhnost_otdel")}</TabsTrigger>
            <TabsTrigger value="finance">{t("generated.finansy")}</TabsTrigger>
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>{t("generated.fio")}</Label>
              <Input
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder={t("generated.ivanov_ivan_ivanovich")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("generated.telefon")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+7 900 000-00-00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Cake className="h-3 w-3" /> {t("generated.den_rozhdeniya") ?? "День рождения"}
                </Label>
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => set("birth_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("generated.email_rabochiy")}</Label>
                <Input
                  type="email"
                  value={form.email_work}
                  onChange={(e) => set("email_work", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("generated.email_lichnyy")}</Label>
                <Input
                  type="email"
                  value={form.email_personal}
                  onChange={(e) => set("email_personal", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Send className="h-3 w-3" /> Telegram ID
                </Label>
                <Input
                  value={form.telegram_id}
                  onChange={(e) => set("telegram_id", e.target.value)}
                  placeholder={t("generated.username_ili_123456789")}
                />
                <p className="text-[10px] text-muted-foreground">
                  {t("generated.chat_id_dlya_sistemnyh_uvedomleniy")}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Work */}
          <TabsContent value="work" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("generated.dolzhnost")}</Label>
                <PositionMultiSelect
                  positions={positions}
                  selectedIds={form.position_ids}
                  onChange={(ids) => set("position_ids", ids)}
                  placeholder={t("generated.ne_vybrana")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("generated.otdel")}</Label>
                <Select
                  value={form.department_id?.toString() ?? "none"}
                  onValueChange={(v) =>
                    set("department_id", v === "none" ? null : parseInt(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("generated.ne_vybran")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("generated.ne_vybran")}</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>{t("generated.akkaunt_v_sisteme")}</Label>
              <Select
                value={form.user_id ?? "none"}
                onValueChange={(v) => set("user_id", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("generated.bez_akkaunta_vneshniy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("generated.bez_akkaunta")}</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {t("generated.esli_ne_vybrat_sotrudnik_suschestvuet_be")}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("generated.data_priema")}</Label>
                <Input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => set("hire_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("generated.data_uvol_neniya")}</Label>
                <Input
                  type="date"
                  value={form.fire_date}
                  onChange={(e) => set("fire_date", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("generated.status_zanyatosti")}</Label>
              <Select
                value={form.employment_status}
                onValueChange={(v) => set("employment_status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatuses(t).map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Finance */}
          <TabsContent value="finance" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>{t("generated.kontragent")}</Label>
              <Select
                value={form.contractor_id?.toString() ?? "none"}
                onValueChange={(v) =>
                  set("contractor_id", v === "none" ? null : parseInt(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("generated.ne_svyazan")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("generated.ne_svyazan")}</SelectItem>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                      {c.type === "individual"
                        ? t('settings.employee.legal_type.individual')
                        : c.type === "company"
                          ? t('settings.employee.legal_type.legal')
                          : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {t("generated.svyaz_s_kartochkoy_kontragenta_dlya_uche")}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("generated.tip_oplaty")}</Label>
                <Select
                  value={form.payment_type}
                  onValueChange={(v) => set("payment_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPaymentTypes(t).map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("generated.valyuta_stavki")}</Label>
                <Select
                  value={form.salary_currency}
                  onValueChange={(v) => set("salary_currency", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.symbol} {c.id} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                {form.payment_type === "hourly" ? t('settings.employees.payment_types.hourly_rate') : t('settings.employees.payment_types.salary')}
              </Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>{t("generated.primechaniya")}</Label>
              <Input
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder={t("generated.neobyazatel_no")}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? t('generated.sohranenie') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Мультивыбор должностей ─────────────────────────────────────────────────
interface PositionMultiSelectProps {
  positions: Position[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
}

function PositionMultiSelect({ positions, selectedIds, onChange, placeholder }: PositionMultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = positions.filter(
    (p) => !selectedIds.includes(p.id) && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const removePosition = (id: number) => {
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const addPosition = (id: number) => {
    onChange([...selectedIds, id]);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Выбранные должности */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {selectedIds.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        {selectedIds.map((id) => {
          const pos = positions.find((p) => p.id === id);
          return pos ? (
            <Badge key={id} variant="secondary" className="gap-1 text-xs">
              {pos.name}
              <button onClick={() => removePosition(id)} className="ml-0.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ) : null;
        })}
      </div>

      {/* Выпадающий список */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs h-9"
          onClick={() => setOpen(!open)}
        >
          <Plus className="w-3 h-3" />
          {t('settings.employees.add_position')}
        </Button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-2">
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs mb-2"
              autoFocus
            />
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {available.length === 0 && (
                <div className="text-xs text-muted-foreground p-2">{t('settings.employees.no_positions_found')}</div>
              )}
              {available.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent"
                  onClick={() => addPosition(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
