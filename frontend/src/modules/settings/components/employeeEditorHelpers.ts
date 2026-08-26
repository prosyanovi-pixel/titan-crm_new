// frontend/src/modules/settings/components/employeeEditorHelpers.ts

export interface Employee {
  id: number;
  full_name: string;
  phone: string;
  email_work: string;
  email_personal: string;
  telegram_id: string;
  position_id: number | null;
  position_ids?: number[];
  department_id: number | null;
  user_id: string | null;
  contractor_id: number | null;
  hire_date: string | null;
  birth_date: string | null;
  fire_date: string | null;
  salary: number | null;
  salary_currency: string;
  payment_type: string;
  employment_status: string;
  notes: string;
  position_name?: string;
  department_name?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  user_status?: string;
  user_avatar?: string | null;
  salary_currency_name?: string;
  salary_currency_symbol?: string;
  contractor_name?: string;
  positions?: Array<{
    position_id: number;
    position_name: string;
    position_role: string;
    is_primary: boolean;
  }>;
}

export interface Position { id: number; name: string }
export interface Department { id: number; name: string }
export interface EmployeeCurrency { id: string; name: string; symbol: string }
export interface EmployeeUser { id: string; name: string; email: string; role: string }
export interface EmployeeContractor { id: number; name: string; type: string }

export const STATUSES = [
  { value: "active", variant: "default" as const },
  { value: "fired", variant: "destructive" as const },
  { value: "maternity", variant: "secondary" as const },
  { value: "vacation", variant: "outline" as const },
] as const;

export const getStatuses = (t: (key: string) => string) => 
  STATUSES.map(s => ({
    ...s,
    label: t(`settings.employees.statuses.${s.value}`)
  }));

export const getPaymentTypes = (t: (key: string) => string) => [
  { value: "salary", label: t('settings.employees.payment_types.salary') },
  { value: "hourly", label: t('settings.employees.payment_types.hourly') },
];

export const EMPTY_FORM = {
  full_name: "",
  phone: "",
  email_work: "",
  email_personal: "",
  telegram_id: "",
  position_id: null as number | null,
  position_ids: [] as number[],
  department_id: null as number | null,
  user_id: null as string | null,
  contractor_id: null as number | null,
  hire_date: "",
  birth_date: "",
  fire_date: "",
  salary: "" as string | number,
  salary_currency: "RUB",
  payment_type: "salary",
  employment_status: "active",
  notes: "",
};

export type EmployeeForm = typeof EMPTY_FORM;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeEmployee = (e: any): Employee => ({
  id: e.id,
  full_name: e.fullName ?? e.full_name ?? "",
  phone: e.phone ?? "",
  email_work: e.emailWork ?? e.email_work ?? "",
  email_personal: e.emailPersonal ?? e.email_personal ?? "",
  telegram_id: e.telegramId ?? e.telegram_id ?? "",
  position_id: e.positionId ?? e.position_id ?? null,
  position_ids: e.position_ids ?? e.positions?.map((p: { position_id: number }) => p.position_id) ?? [],
  department_id: e.departmentId ?? e.department_id ?? null,
  user_id: e.userId ?? e.user_id ?? null,
  contractor_id: e.contractorId ?? e.contractor_id ?? null,
  hire_date: e.hireDate ?? e.hire_date ?? null,
  birth_date: e.birthDate ?? e.birth_date ?? null,
  fire_date: e.fireDate ?? e.fire_date ?? null,
  salary: e.salary ?? null,
  salary_currency: e.salaryCurrency ?? e.salary_currency ?? "RUB",
  payment_type: e.paymentType ?? e.payment_type ?? "salary",
  employment_status: e.employmentStatus ?? e.employment_status ?? e.employmentstatus ?? "active",
  notes: e.notes ?? "",
  position_name: e.positionName ?? e.position_name,
  department_name: e.departmentName ?? e.department_name,
  user_name: e.userName ?? e.user_name,
  user_email: e.userEmail ?? e.user_email,
  user_role: e.userRole ?? e.user_role,
  user_status: e.userStatus ?? e.user_status,
  salary_currency_name: e.salaryCurrencyName ?? e.salary_currency_name,
  salary_currency_symbol: e.salaryCurrencySymbol ?? e.salary_currency_symbol,
  contractor_name: e.contractorName ?? e.contractor_name,
  positions: e.positions ?? [],
});
