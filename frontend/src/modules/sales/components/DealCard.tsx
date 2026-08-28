import React from "react";
import { SalesDeal } from "../types";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSignature, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DealCardProps {
  deal: SalesDeal;
  onClick: (deal: SalesDeal) => void;
  isOverlay?: boolean;
}

export function DealCard({ deal, onClick, isOverlay }: DealCardProps) {
  const { t } = useTranslation();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id.toString(),
    data: {
      type: "Deal",
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(deal)}
      className={`group cursor-grab hover:border-primary/50 hover:shadow-md transition-all ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      } ${isOverlay ? "shadow-lg scale-105 rotate-2 cursor-grabbing" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium text-sm line-clamp-2">{deal.name}</div>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary">
            {getInitials(deal.client)}
          </div>
          <span className="truncate">{deal.client || t("projects.placeholder.no_parent")}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded-md">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat('ru-RU').format(deal.quotesSum)} ₽
            </span>
          </div>
          {deal.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded-md">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>{new Date(deal.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 flex gap-1 ${deal.quotesCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
          >
            <FileText className="w-3 h-3" />
            {deal.quotesCount} КП
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 flex gap-1 ${deal.contractsCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
          >
            <FileSignature className="w-3 h-3" />
            {deal.contractsCount} Дог
          </Badge>
          
          {deal.activeClaimsCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 flex gap-1 bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3" />
              {deal.activeClaimsCount} Рекл
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
