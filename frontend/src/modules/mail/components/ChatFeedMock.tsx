import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { MessageSquare, Phone, MoreVertical, Search, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ChatFeedMock() {
  const { t } = useTranslation();

  const chats = [
    { id: 1, name: 'Анна Иванова (Telegram)', message: 'Отправила документы по договору', time: '10:45', unread: 2, avatar: 'АИ', platform: 'tg' },
    { id: 2, name: 'ООО "ТехПром" (WhatsApp)', message: 'Когда ожидать поставку?', time: 'Вчера', unread: 0, avatar: 'ТП', platform: 'wa' },
    { id: 3, name: 'Сергей Петров', message: 'Спасибо, всё получил', time: 'Среда', unread: 0, avatar: 'СП', platform: 'tg' },
  ];

  return (
    <div className="flex h-full w-full bg-background border-t">
      {/* Список чатов */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold">Чаты</div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск чатов..." className="pl-9 bg-background" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat, i) => (
              <div 
                key={chat.id} 
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className={i === 0 ? 'bg-blue-100 text-blue-700' : ''}>{chat.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-sm truncate">{chat.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground truncate">{chat.message}</span>
                    {chat.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shrink-0 ml-2">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Окно переписки */}
      <div className="flex-1 flex flex-col bg-background/50">
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-blue-100 text-blue-700">АИ</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">Анна Иванова (Telegram)</div>
              <div className="text-xs text-green-500">В сети</div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">Сегодня</span>
            </div>
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8 mt-auto shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700">АИ</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                <p className="text-sm">Доброе утро! Договор подписали, скан отправляю. Оригинал будет курьером завтра.</p>
                <span className="text-[10px] text-muted-foreground mt-1 block">10:42</span>
              </div>
            </div>
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8 mt-auto shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700">АИ</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                <p className="text-sm">Отправила документы по договору</p>
                <span className="text-[10px] text-muted-foreground mt-1 block">10:45</span>
              </div>
            </div>
            
            {/* Имитация заглушки для демонстрации */}
            <div className="flex items-center justify-center pt-10 opacity-50">
              <div className="text-center">
                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Демонстрационный режим</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Интеграция с мессенджерами запланирована в следующих релизах.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input placeholder="Введите сообщение..." className="flex-1 bg-muted/50 border-transparent focus-visible:ring-1" />
            <Button size="icon" className="shrink-0 h-10 w-10 rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
