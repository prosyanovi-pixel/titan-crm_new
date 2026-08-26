
import { LegalCase } from "../../types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTranslation } from "@/lib/i18n";

interface CaseAnalyticsTabProps {
  legalCase: Partial<LegalCase>;
}

export function CaseAnalyticsTab({ legalCase }: CaseAnalyticsTabProps) {
  const { t } = useTranslation();

  const totalExpenses = (legalCase.transportExpenses || 0) + (legalCase.translationExpenses || 0) + (legalCase.otherExpenses || 0);
  
  const data = [
    { name: t('lawyers.case_sheet.finance.transport'), value: legalCase.transportExpenses || 0 },
    { name: t('lawyers.case_sheet.finance.translation'), value: legalCase.translationExpenses || 0 },
    { name: t('lawyers.case_sheet.finance.other'), value: legalCase.otherExpenses || 0 },
  ].filter(i => i.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const income = (legalCase.price || 0); // Income for the firm
  const expenses = totalExpenses; // Expenses for the firm (simplified)
  const netProfit = income - expenses;
  const roi = expenses > 0 ? ((netProfit / expenses) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">{t('lawyers.case_sheet.analytics.roi')}</div>
                <div className={`text-2xl font-bold ${parseFloat(roi) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi}%
                </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">{t('lawyers.case_sheet.analytics.net_profit')}</div>
                <div className="text-2xl font-bold">
                    {netProfit.toLocaleString()} RUB
                </div>
            </div>
        </div>

        <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-4 text-center">{t('lawyers.case_sheet.analytics.expenses_structure')}</h4>
            {data.length > 0 ? (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    {t('generated.net_dannyh_o_rashodah')}
                </div>
            )}
        </div>
    </div>
  );
}
