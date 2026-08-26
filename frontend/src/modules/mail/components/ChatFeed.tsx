import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { MessageSquare, MoreVertical, Search, Plus, Send, Settings, Trash2, Edit2, Paperclip, X, FileText, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Combobox } from '@/components/ui/combobox';
import { useChats, useChatMessages, useChatMutations, CHAT_KEYS } from '../hooks/useChatQueries';
import { type ChatMessage } from '../api/chats.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { authService } from '@/modules/auth/api/authService';
export function ChatFeed() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatPlatform, setNewChatPlatform] = useState('internal');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-chat'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return (res || []) as Array<{ id: number; name: string; email: string; phone?: string; telegram_token?: string; avatar?: string }>;
    }
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState('0');
  
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size?: number; type?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id ? parseInt(currentUser.id, 10) : null;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings to check active platforms
  const { data: sysSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.get('/system-settings').then(res => res?.data ?? res ?? {})
  });
  
  const tgEnabled = sysSettings?.telegram_config?.enabled || false;
  const waEnabled = sysSettings?.whatsapp_config?.enabled || false;

  const { data: chatsData, isLoading: isLoadingChats } = useChats({ search: searchQuery });
  const chats = chatsData?.data || [];

  const { data: messagesData, isLoading: isLoadingMessages } = useChatMessages(activeChatId);
  const messages = messagesData?.data || [];

  const { sendMessage, editMessage, clearHistory, deleteChat, uploadFile, markAsRead, createChat } = useChatMutations();

  const activeChat = chats.find(c => c.id === activeChatId);

  const { addCallback, removeCallback } = useWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const callbacks = {
      onChatMessage: (data: { chatId?: number } & Record<string, unknown>) => {
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
        if (data?.chatId === activeChatId || data?.chatId) {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(data.chatId) });
        }
      }
    };
    addCallback(callbacks);
    return () => removeCallback(callbacks);
  }, [addCallback, removeCallback, queryClient, activeChatId]);

  useEffect(() => {
    if (activeChatId && activeChat?.unreadCount && activeChat.unreadCount > 0) {
      markAsRead.mutate(activeChatId);
    }
  }, [activeChatId, activeChat?.unreadCount, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.data]);

  const handleSendMessage = () => {
    if ((!messageText.trim() && attachments.length === 0) || !activeChatId) return;
    
    if (editingMessageId) {
      editMessage.mutate(
        { chatId: activeChatId, messageId: editingMessageId, text: messageText },
        {
          onSuccess: () => {
            setMessageText('');
            setEditingMessageId(null);
          }
        }
      );
    } else {
      sendMessage.mutate(
        { chatId: activeChatId, text: messageText, attachments },
        {
          onSuccess: () => {
            setMessageText('');
            setAttachments([]);
          }
        }
      );
    }
  };

  const handleCreateChat = () => {
    setIsCreateModalOpen(true);
    setNewChatName('');
    setSelectedUserId('');
    setNewChatPlatform('internal');
  };

  const submitCreateChat = () => {
    if (newChatName?.trim()) {
      createChat.mutate(
        { name: newChatName.trim(), platform: newChatPlatform },
        {
          onSuccess: (data: unknown) => {
             const res = data as { data?: { id: number }; id?: number };
             setActiveChatId(res?.data?.id || res?.id || null);
             setIsCreateModalOpen(false);
          }
        }
      );
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadFile.mutate(file, {
      onSuccess: (res: unknown) => {
        const payload = res as { data?: { name: string; url: string; size?: number; type?: string }; name: string; url: string; size?: number; type?: string };
        const attachment = payload.data || payload;
        setAttachments(prev => [...prev, attachment]);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleEditClick = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setMessageText(msg.text);
    // Focus input?
  };
  
  const handleDeleteChat = () => {
    if (!activeChatId) return;
    if (confirm('Вы уверены, что хотите удалить этот чат?')) {
      deleteChat.mutate(activeChatId, {
        onSuccess: () => setActiveChatId(null)
      });
    }
  };
  
  const handleClearHistory = () => {
    if (!activeChatId) return;
    if (confirm('Вы уверены, что хотите очистить историю?')) {
      clearHistory.mutate(activeChatId);
    }
  };
  
  const saveChatSettings = () => {
    // Ideally we would have an updateChat mutation. For now, since it's just frontend mock or basic:
    if (activeChatId) {
      api.put(`/chats/${activeChatId}`, { settings: { retentionDays: parseInt(retentionDays, 10) } })
         .then(() => {
           queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
           setIsSettingsOpen(false);
         });
    }
  };

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'HH:mm');
  };
  
  const renderAttachment = (att: { name: string; url: string; size?: number; type?: string }) => {
    const isImage = att.type?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png)$/i);
    if (isImage) {
      return <img src={att.url} alt={att.name} className="max-w-[200px] max-h-[200px] rounded object-cover mt-2" />;
    }
    return (
      <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded text-sm hover:underline">
        <FileText className="w-4 h-4" />
        <span className="truncate max-w-[150px]">{att.name}</span>
      </a>
    );
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] w-full bg-background border-t">
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {newChatPlatform === 'internal' ? (
              <div className="space-y-2 flex flex-col">
                <Label>Собеседник</Label>
                <Combobox 
                  className="w-full"
                  options={usersData?.map(u => ({ 
                    value: u.id.toString(), 
                    label: `${u.name} (${u.email})`,
                    icon: (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                    )
                  })) || []}
                  value={selectedUserId}
                  onChange={(val) => {
                    setSelectedUserId(val);
                    const user = usersData?.find(u => u.id.toString() === val);
                    if (user) setNewChatName(user.name);
                  }}
                  placeholder="Поиск пользователя..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Имя собеседника / Название чата</Label>
                <Input 
                  value={newChatName} 
                  onChange={(e) => setNewChatName(e.target.value)} 
                  placeholder="Иван Иванов" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Платформа</Label>
              <Select value={newChatPlatform} onValueChange={setNewChatPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Внутренний чат</SelectItem>
                  {tgEnabled && (
                    <SelectItem value="telegram">
                      Telegram
                      {selectedUserId && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {usersData?.find(u => u.id.toString() === selectedUserId)?.telegram_token ? '(доступно)' : ''}
                        </span>
                      )}
                    </SelectItem>
                  )}
                  {waEnabled && (
                    <SelectItem value="whatsapp">
                      WhatsApp
                      {selectedUserId && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {usersData?.find(u => u.id.toString() === selectedUserId)?.phone ? '(доступно)' : ''}
                        </span>
                      )}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Отмена</Button>
            <Button onClick={submitCreateChat} disabled={!newChatName.trim() || createChat.isPending}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки чата</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Удалять сообщения старше (дней)</Label>
              <Input 
                type="number"
                value={retentionDays} 
                onChange={(e) => setRetentionDays(e.target.value)} 
                placeholder="0 для отключения" 
              />
              <p className="text-xs text-muted-foreground">0 - хранить вечно</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Отмена</Button>
            <Button onClick={saveChatSettings}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Список чатов */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold">Чаты</div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCreateChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Поиск чатов..." 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoadingChats ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Загрузка...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Нет чатов</div>
            ) : (
              chats.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={chat.avatarUrl || chat.userAvatarFallback} />
                    <AvatarFallback className={activeChatId === chat.id ? 'bg-blue-100 text-blue-700' : ''}>
                      {getInitials(chat.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-sm truncate">{chat.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground truncate">{chat.lastMessage || '...'}</span>
                      {(chat.unreadCount > 0) && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shrink-0 ml-2">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Окно переписки */}
      <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Выберите чат для просмотра сообщений
          </div>
        ) : (
          <>
            <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0 z-10 relative">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={activeChat?.avatarUrl || activeChat?.userAvatarFallback} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(activeChat?.name || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {activeChat?.name} {activeChat?.platform === 'internal' ? '(Внутренний)' : `(${activeChat?.platform})`}
                    {(activeChat?.isOnline) && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="В сети"></span>
                    )}
                  </div>
                  {(activeChat?.lastActiveAt) && !(activeChat?.isOnline) && (
                    <div className="text-xs text-muted-foreground">
                      Был(а) {formatTime(activeChat.lastActiveAt)}
                    </div>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setRetentionDays(activeChat?.settings?.retentionDays?.toString() || '0');
                    setIsSettingsOpen(true);
                  }}>
                    <Settings className="w-4 h-4 mr-2" /> Настройки чата
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearHistory}>
                    <Trash2 className="w-4 h-4 mr-2" /> Очистить историю
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteChat} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить чат
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <ScrollArea className="flex-1 p-4 h-full relative z-0">
              <div className="space-y-4 pb-4">
                {isLoadingMessages ? (
                  <div className="text-center text-sm text-muted-foreground">Загрузка сообщений...</div>
                ) : (
                  messages.map(msg => {
                    const isCompany = msg.senderType === 'user';
                    const isMe = isCompany && msg.senderId === currentUserId;
                    const isInternalChat = activeChat?.platform === 'internal';
                  
                    const alignRight = isInternalChat ? isMe : isCompany;
                    const showAvatar = isInternalChat ? !isMe : !isCompany;
                    const avatarInitials = isInternalChat 
                      ? getInitials(msg.senderFirstName || '??') 
                      : getInitials(activeChat?.name || '');
                    const avatarUrl = isInternalChat ? msg.senderAvatarUrl : undefined;
                    const bubbleClass = (isInternalChat ? isMe : isCompany) 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-muted rounded-bl-sm';

                    return (
                      <div key={msg.id} className={`flex gap-3 group max-w-[80%] ${alignRight ? 'ml-auto flex-row-reverse' : ''}`}>
                        {showAvatar && (
                          <div className="flex flex-col items-center gap-1 mt-auto shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className="flex flex-col relative max-w-full">
                          {isInternalChat && !isMe && (msg.senderFirstName) && (
                            <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">{msg.senderFirstName} {msg.senderLastName}</span>
                          )}
                          <div className={`p-3 rounded-2xl relative ${bubbleClass}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-col gap-1 mt-2">
                                {msg.attachments.map((att: { name: string; url: string; size?: number; type?: string }, idx: number) => (
                                  <div key={idx}>{renderAttachment(att)}</div>
                                ))}
                              </div>
                            )}

                            <div className={`flex items-center gap-1 text-[10px] mt-1 ${alignRight ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {(msg.isEdited) && <span>(изменено)</span>}
                              <span>{formatTime(msg.createdAt)}</span>
                              {alignRight && (
                                msg.isRead ? <CheckCheck className="w-3 h-3 ml-0.5" /> : <Check className="w-3 h-3 ml-0.5" />
                              )}
                            </div>
                            
                            {alignRight && !msg.externalMessageId && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 h-8 w-8 transition-opacity"
                                onClick={() => handleEditClick(msg)}
                              >
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t bg-background shrink-0 z-10 relative">
              {editingMessageId && (
                <div className="flex items-center justify-between bg-muted p-2 rounded-t-lg -mx-3 -mt-3 mb-3 border-b text-sm">
                  <div className="flex items-center text-primary gap-2">
                    <Edit2 className="w-4 h-4" />
                    <span>Редактирование сообщения</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingMessageId(null); setMessageText(''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted p-1.5 rounded-md text-xs border">
                      {att.type?.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-amber-500" />}
                      <span className="max-w-[100px] truncate">{att.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              
              <form 
                className="flex items-end gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                {!editingMessageId && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 mb-1" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFile.isPending}
                  >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
                <Input 
                  placeholder="Введите сообщение..." 
                  className="flex-1 bg-muted/50 border-transparent focus-visible:ring-1"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="shrink-0 h-10 w-10 rounded-full mb-0.5"
                  disabled={sendMessage.isPending || editMessage.isPending || (!messageText.trim() && attachments.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
