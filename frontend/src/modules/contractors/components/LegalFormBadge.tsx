import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Building, Landmark, Scale, Tractor, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalFormBadgeProps {
  code?: string;
  className?: string;
}

/**
 * Бейдж для отображения юридической формы контрагента с иконкой.
 */
export function LegalFormBadge({ code, className }: LegalFormBadgeProps) {
  if (!code) return null;

  const normalizedCode = code.toLowerCase();

  const getIcon = () => {
    switch (normalizedCode) {
      case 'ip': return <User className="w-3 h-3" />;
      case 'ooo': return <Building2 className="w-3 h-3" />;
      case 'ao':
      case 'pao':
      case 'zao':
      case 'oao': return <Landmark className="w-3 h-3" />;
      case 'gup':
      case 'mup': return <Building className="w-3 h-3" />;
      case 'kfh': return <Tractor className="w-3 h-3" />;
      case 'ano':
      case 'nko': return <Handshake className="w-3 h-3" />;
      case 'self': return <User className="w-3 h-3" />;
      case 'private': return <User className="w-3 h-3" />;
      default: return null;
    }
  };

  const icon = getIcon();
  if (!icon) return null;

  const getLabel = () => {
    return code.toUpperCase();
  };

  const getVariant = () => {
    switch (normalizedCode) {
      case 'ip': return 'outline' as const;
      case 'ooo': return 'default' as const;
      case 'pao':
      case 'ao': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={cn("gap-1 px-1.5 h-5 text-[10px] font-bold uppercase", className)}
    >
      {getIcon()}
      {getLabel()}
    </Badge>
  );
}
