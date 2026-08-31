import { useTranslation } from '@/lib/i18n';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PriceListOverviewTabProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function PriceListOverviewTab({ formData, onChange }: PriceListOverviewTabProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();

  return (
    <div className="space-y-6 pt-4 px-2 max-w-xl">
      <div className="space-y-2">
        <Label>{t('common.name')}</Label>
        <Input
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder={t('price_lists.name_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('common.currency')}</Label>
        <Select value={formData.currency || ''} onValueChange={(val) => onChange('currency', val)}>
          <SelectTrigger>
            <SelectValue placeholder={t('price_lists.currency_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.id} ({c.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 pt-2">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
          <div className="space-y-0.5">
            <Label className="text-base">{t('common.status')}</Label>
          </div>
          <Switch
            checked={!!formData.isActive}
            onCheckedChange={(val) => onChange('isActive', val)}
          />
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
          <div className="space-y-0.5">
            <Label className="text-base">{t('price_lists.is_default')}</Label>
          </div>
          <Switch
            checked={!!formData.isDefault}
            onCheckedChange={(val) => onChange('isDefault', val)}
          />
        </div>
      </div>
    </div>
  );
}
