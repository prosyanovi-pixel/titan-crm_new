import React from 'react';
import { Phone, PhoneCall, PhoneForwarded, PhoneMissed, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function CallHistoryMock() {
  const calls = [
    { id: 1, name: 'Иван Сергеев', number: '+7 (999) 123-45-67', time: 'Сегодня, 14:30', duration: '05:20', type: 'incoming', status: 'success', avatar: 'ИС' },
    { id: 2, name: 'ООО "Альфа"', number: '+7 (495) 777-88-99', time: 'Сегодня, 11:15', duration: '00:00', type: 'incoming', status: 'missed', avatar: 'АЛ' },
    { id: 3, name: 'Неизвестный', number: '+7 (903) 111-22-33', time: 'Вчера, 16:45', duration: '02:10', type: 'outgoing', status: 'success', avatar: '?' },
    { id: 4, name: 'Елена Смирнова', number: '+7 (916) 555-44-33', time: 'Вчера, 10:05', duration: '12:45', type: 'incoming', status: 'success', avatar: 'ЕС' },
    { id: 5, name: 'ПАО "ГазТорг"', number: '+7 (800) 100-20-30', time: '12 Апр, 09:20', duration: '01:15', type: 'outgoing', status: 'success', avatar: 'ГТ' },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background border-t">
      <div className="p-4 border-b flex items-center justify-between bg-muted/10">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск по звонкам..." className="pl-9 bg-background h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Фильтры
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <Phone className="h-4 w-4" /> Позвонить
        </Button>
      </div>
      
      <ScrollArea className="flex-1 bg-muted/5">
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">История звонков</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-background">Все звонки</Badge>
              <Badge variant="secondary" className="cursor-pointer">Пропущенные (1)</Badge>
            </div>
          </div>

          <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-10 text-center">Тип</div>
              <div>Контакт</div>
              <div>Дата и время</div>
              <div>Длительность</div>
              <div className="w-24 text-right">Действие</div>
            </div>
            
            <div className="divide-y">
              {calls.map((call) => (
                <div key={call.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="w-10 flex justify-center">
                    {call.type === 'incoming' && call.status === 'success' && <PhoneCall className="h-5 w-5 text-blue-500" />}
                    {call.type === 'incoming' && call.status === 'missed' && <PhoneMissed className="h-5 w-5 text-red-500" />}
                    {call.type === 'outgoing' && <PhoneForwarded className="h-5 w-5 text-green-500" />}
                  </div>
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className={call.status === 'missed' ? 'bg-red-50 text-red-600' : ''}>{call.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <div className="font-medium text-sm truncate">{call.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{call.number}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">{call.time}</div>
                  
                  <div className="text-sm flex items-center gap-2">
                    {call.duration}
                    {call.duration !== '00:00' && (
                      <div className="h-6 w-24 bg-muted rounded-full flex items-center px-2">
                        <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-1/3"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-24 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center opacity-50 p-6 border border-dashed rounded-xl">
            <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-medium">Модуль Телефонии (Демо)</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Здесь будет отображаться интеграция с облачными АТС (Mango, Zadarma, Aircall). 
              Включает запись разговоров, транскрибацию и click-to-call.
            </p>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
