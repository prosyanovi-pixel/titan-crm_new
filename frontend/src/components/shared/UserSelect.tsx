
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface User {
    id: string;
    name: string;
    initials?: string;
    role?: string;
    avatar?: string;
}

interface UserSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  endpoint?: string;
}

export function UserSelect({ value, onValueChange, placeholder, className, endpoint = '/users' }: UserSelectProps) {
  const { t } = useTranslation();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-select', endpoint],
    queryFn: async () => {
      const data = await api.get(endpoint);
      if (Array.isArray(data)) {
        return data as User[];
      } else if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)) {
        return (data as Record<string, unknown>).data as User[];
      } else if (data && typeof data === 'object') {
        return [data as User];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getInitials = (user: User) => {
    if (user.initials) return user.initials;
    if (!user.name) return '??';
    const parts = user.name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.name.substring(0, 2).toUpperCase();
  };
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder={placeholder || t('common.select_user')}>
          {value && Array.isArray(users) && users.find(u => u.name === value) ? (() => {
            const selectedUser = users.find(u => u.name === value)!;
            return (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedUser.avatar || ''} alt={selectedUser.name} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {getInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedUser.name}</span>
              </div>
            );
          })() : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Array.isArray(users) && users.length > 0 ? (
          users.map((user) => (
            <SelectItem key={user.id} value={user.name}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatar || ''} alt={user.name} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-users" disabled>
            {t('components.select.no_users_found')}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
