import React from 'react';
import { Mail, MessageSquare, PhoneCall, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function UnifiedFeedMock() {
  const feed = [
    { id: 1, type: 'mail', title: 'Договор на согласование', sender: 'legal@example.com', time: '10:45', preview: 'Коллеги, направляю финальную версию договора...', unread: true },
    { id: 2, type: 'chat', title: 'Анна Иванова (Telegram)', sender: 'Анна', time: '10:30', preview: 'Отправила документы по договору', unread: true },
    { id: 3, type: 'call', title: 'Пропущенный звонок', sender: '+7 (495) 777-88-99', time: '09:15', preview: 'ООО "Альфа"', unread: true },
    { id: 4, type: 'mail', title: 'Еженедельный отчет', sender: 'analytics@example.com', time: 'Вчера', preview: 'Отчет по продажам за прошедшую неделю готов.', unread: false },
    { id: 5, type: 'chat', title: 'ООО "ТехПром" (WhatsApp)', sender: 'Игорь', time: 'Вчера', preview: 'Когда ожидать поставку?', unread: false },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mail': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'chat': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'call': return <PhoneCall className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'mail': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Письмо</Badge>;
      case 'chat': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Чат</Badge>;
      case 'call': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Звонок</Badge>;
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background border-t">
      <div className="p-3 border-b flex items-center justify-between bg-muted/10">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="h-8 text-xs font-medium bg-background shadow-sm">
            Все события
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
            Непрочитанные <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">3</Badge>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 bg-muted/5">
        <div className="max-w-3xl mx-auto p-4 space-y-3">
          
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
            Сводная лента (Демо)
          </div>
          
          {feed.map((item) => (
            <div 
              key={item.id} 
              className={`bg-background p-4 rounded-xl border shadow-sm flex gap-4 transition-all hover:shadow-md cursor-pointer ${item.unread ? 'border-primary/20 bg-primary/5' : ''}`}
            >
              <div className="mt-1">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.unread ? 'bg-background shadow-sm border' : 'bg-muted'}`}>
                  {getTypeIcon(item.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm truncate ${item.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.title}
                    </span>
                    {getTypeBadge(item.type)}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 ml-2">
                    {item.time}
                  </span>
                </div>
                
                <div className="text-sm font-medium mb-1 truncate">
                  {item.sender}
                </div>
                
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {item.preview}
                </div>
              </div>
              
              {item.unread && (
                <div className="flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                </div>
              )}
            </div>
          ))}
          
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Вы просмотрели все новые события</p>
          </div>
          
        </div>
      </ScrollArea>
    </div>
  );
}
