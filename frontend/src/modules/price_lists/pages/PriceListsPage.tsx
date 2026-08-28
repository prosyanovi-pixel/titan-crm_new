import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageSettings } from '@/context/LayoutContext';
import { usePriceLists } from '../hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function PriceListsPage() {
  const { t } = useTranslation();
  const { data: priceLists, isLoading } = usePriceLists();

  usePageSettings({
    title: t('price_lists.title') /* Прайс-листы */,
    subtitle: t('price_lists.subtitle') /* Управление ценами на товары и услуги */,
    actions: (
      <Button className="gap-2 h-9">
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('price_lists.add_button')} {/* Создать прайс-лист */}</span>
      </Button>
    )
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('price_lists.list_title')} {/* Список прайс-листов */}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')} {/* Название */}</TableHead>
                <TableHead>{t('common.currency')} {/* Валюта */}</TableHead>
                <TableHead>{t('common.status')} {/* Статус */}</TableHead>
                <TableHead>{t('price_lists.is_default')} {/* По умолчанию */}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t('common.loading')} {/* Загрузка... */}
                  </TableCell>
                </TableRow>
              ) : priceLists?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t('common.no_data')} {/* Нет данных */}
                  </TableCell>
                </TableRow>
              ) : (
                priceLists?.map((pl) => (
                  <TableRow key={pl.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{pl.name}</TableCell>
                    <TableCell>{pl.currency}</TableCell>
                    <TableCell>
                      <Badge variant={pl.isActive ? 'default' : 'secondary'}>
                        {pl.isActive ? t('common.active') /* Активен */ : t('common.inactive') /* Неактивен */}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pl.isDefault && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {t('common.yes')} {/* Да */}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
