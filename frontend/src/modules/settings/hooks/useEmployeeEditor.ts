// frontend/src/modules/settings/hooks/useEmployeeEditor.ts
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import {
  EMPTY_FORM,
  normalizeEmployee,
  getStatuses,
  type Employee,
  type Position,
  type Department,
  type EmployeeCurrency,
  type EmployeeUser,
  type EmployeeContractor,
  type EmployeeForm,
  STATUSES,
} from "../components/employeeEditorHelpers";

export function useEmployeeEditor() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currencies, setCurrencies] = useState<EmployeeCurrency[]>([]);
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [contractors, setContractors] = useState<EmployeeContractor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: fetchedData, isLoading: loading, refetch } = useQuery({
    queryKey: ['settings-employee-editor'],
    queryFn: async () => {
      const [empl, pos, depts, cur, usr, cons] = await Promise.all([
        api.get("/employees"),
        api.get("/org/positions"),
        api.get("/org/departments"),
        api.get("/references/currencies"),
        api.get("/users"),
        api.get("/contractors?all=true"),
      ]);
      return { empl, pos, depts, cur, usr, cons };
    },
    staleTime: 5 * 60 * 1000,
  });

  const [prevFetchedData, setPrevFetchedData] = useState<unknown>(null);
  if (fetchedData !== prevFetchedData) {
    setPrevFetchedData(fetchedData);
    if (fetchedData) {
      const data = fetchedData as any;
      setEmployees(Array.isArray(data.empl) ? data.empl.map(normalizeEmployee) : []);
      setPositions(Array.isArray(data.pos) ? data.pos : []);
      setDepartments(Array.isArray(data.depts) ? data.depts : []);
      setCurrencies(Array.isArray(data.cur) ? data.cur : []);
      setUsers(Array.isArray(data.usr) ? data.usr : []);
      setContractors(Array.isArray(data.cons) ? data.cons : []);
    }
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    const posIds = e.positions?.map(p => p.position_id) ?? (e.position_id ? [e.position_id] : []);
    setForm({
      full_name: e.full_name,
      phone: e.phone || "",
      email_work: e.email_work || "",
      email_personal: e.email_personal || "",
      telegram_id: e.telegram_id || "",
      position_id: e.position_id,
      position_ids: posIds,
      department_id: e.department_id,
      user_id: e.user_id,
      contractor_id: e.contractor_id,
      hire_date: e.hire_date ? e.hire_date.split("T")[0] : "",
      birth_date: e.birth_date ? e.birth_date.split("T")[0] : "",
      fire_date: e.fire_date ? e.fire_date.split("T")[0] : "",
      salary: e.salary ?? "",
      salary_currency: e.salary_currency || "RUB",
      payment_type: e.payment_type || "salary",
      employment_status: e.employment_status || "active",
      notes: e.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error(t("generated.fio_obyazatel_no"));
      return;
    }
    setSaving(true);
    try {
      const posIds = form.position_ids?.filter(Boolean) ?? [];
      const payload = {
        ...form,
        position_ids: posIds.length > 0 ? posIds : undefined,
        salary: form.salary === "" ? null : parseFloat(String(form.salary)),
        hire_date: form.hire_date || null,
        birth_date: form.birth_date || null,
        fire_date: form.fire_date || null,
      };
      if (editingId) {
        const res = await api.put(`/employees/${editingId}`, payload);
        setEmployees((prev) =>
          prev.map((e) => (e.id === editingId ? normalizeEmployee(res) : e)),
        );
        toast.success(t("generated.sotrudnik_obnovlen"));
      } else {
        const res = await api.post("/employees", payload);
        setEmployees((prev) => [...prev, normalizeEmployee(res)]);
        toast.success(t("generated.sotrudnik_dobavlen"));
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('settings.validation.error');
      toast.error(msg);
      console.error('Employee save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success(t("generated.sotrudnik_udalen"));
    } catch {
      toast.error(t("generated.oshibka_udaleniya"));
    }
  };

  const getStatusInfo = (status: string) => {
    const list = getStatuses(t);
    return list.find((s) => s.value === status) ?? list[0];
  };

  const filtered =
    filterStatus === "all"
      ? employees
      : employees.filter((e) => e.employment_status === filterStatus);

  return {
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
  };
}
