import { useState } from "react";
import { ResizableSheet } from "@/components/shared";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Target, Calculator, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Contractor } from "@/modules/contractors";
import { EntityCombobox, ComboboxOption } from "@/components/shared/EntityCombobox";
import { toast } from "sonner";

interface CreateDealWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contractors: Contractor[];
}

export function CreateDealWizard({ open, onOpenChange, onSuccess, contractors }: CreateDealWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [dealName, setDealName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("lead");

  // Quote State
  const [includeQuote, setIncludeQuote] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");

  // Task State
  const [includeTask, setIncludeTask] = useState(true);
  const [taskTitle, setTaskTitle] = useState("Связаться с клиентом");
  const [taskDueDate, setTaskDueDate] = useState("");

  const handleNext = () => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  const handlePrev = () => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);

  const handleSubmit = async () => {
    if (!dealName) {
      toast.error("Название сделки обязательно");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        projectData: {
          name: dealName,
          client: clientId ? contractors.find(c => c.id.toString() === clientId)?.name : null,
          description,
          stage,
          status: 'active'
        },
        quoteData: includeQuote && quoteAmount ? { total_amount: parseFloat(quoteAmount) } : null,
        taskData: includeTask && taskTitle ? { title: taskTitle, due_date: taskDueDate || null } : null
      };

      await api.post('/sales/deals/wizard', payload);
      toast.success("Сделка успешно создана!");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setStep(1);
      setDealName("");
      setClientId("");
      setDescription("");
      setIncludeQuote(false);
      setQuoteAmount("");
      setIncludeTask(true);
      setTaskTitle("Связаться с клиентом");
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при создании сделки");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Детали сделки", icon: Target },
    { num: 2, title: "Коммерческое предложение", icon: Calculator },
    { num: 3, title: "Первая задача", icon: CheckCircle2 }
  ];

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      moduleKey="sales_wizard"
      defaultWidth="lg"
      title="Мастер создания сделки"
      description="Заполните информацию шаг за шагом"
    >
      <div className="flex flex-col h-full bg-muted/10">
        <div className="px-6 py-4 border-b bg-background">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary/10' : isCompleted ? 'border-emerald-500 bg-emerald-50' : 'border-muted bg-muted'}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wider">{s.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название сделки *</Label>
                  <Input value={dealName} onChange={e => setDealName(e.target.value)} placeholder="Например: Поставка серверов" />
                </div>

                <div className="space-y-2">
                  <Label>Клиент</Label>
                  <EntityCombobox
                    options={contractors.map(c => ({ id: String(c.id), label: c.name } as ComboboxOption))}
                    value={clientId}
                    onChange={(v) => setClientId(v ? String(v) : "")}
                    placeholder="Выберите клиента"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Стадия воронки</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите стадию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Новый лид</SelectItem>
                      <SelectItem value="negotiation">Переговоры</SelectItem>
                      <SelectItem value="quote_prep">Подготовка КП</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Описание (Заметки)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Дополнительная информация..." />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <Card className="border-primary/20 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setIncludeQuote(!includeQuote)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${includeQuote ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">Сгенерировать черновик КП</div>
                      <div className="text-xs text-muted-foreground">Создать базовое коммерческое предложение для сделки</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${includeQuote ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {includeQuote && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </CardContent>
              </Card>

              {includeQuote && (
                <div className="space-y-4 p-4 border rounded-lg bg-background animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Ожидаемая сумма КП (₽)</Label>
                    <Input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="150000" />
                  </div>
                  <p className="text-xs text-muted-foreground">Остальные детали вы сможете заполнить позже в карточке сделки.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <Card className="border-primary/20 shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => setIncludeTask(!includeTask)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${includeTask ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">Поставить первую задачу</div>
                      <div className="text-xs text-muted-foreground">Запланировать следующий шаг по клиенту</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${includeTask ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {includeTask && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </CardContent>
              </Card>

              {includeTask && (
                <div className="space-y-4 p-4 border rounded-lg bg-background animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Что нужно сделать?</Label>
                    <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Позвонить клиенту..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Крайний срок</Label>
                    <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext}>
              Далее
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Создать сделку
            </Button>
          )}
        </div>
      </div>
    </ResizableSheet>
  );
}
