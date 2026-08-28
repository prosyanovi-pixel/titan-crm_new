import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { usePageSettings } from "@/context/LayoutContext";
import { useSalesPipeline } from "../hooks/useSalesPipeline";
import { DealCard } from "../components/DealCard";
import { SalesDeal, SalesStage } from "../types";
import { Project } from "@/modules/projects/types";
import { DealHubSheet } from "../components/DealHubSheet";
import { ProjectSheet } from "@/modules/projects/components/ProjectSheet";
import { useProjectsPage } from "@/modules/projects/hooks/useProjectsPage";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent,
  useDroppable 
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";

interface DroppableColumnProps {
  id: SalesStage;
  title: string;
  deals: SalesDeal[];
  onDealClick: (deal: SalesDeal) => void;
  t: (key: string) => string;
}

function DroppableColumn({ id, title, deals, onDealClick, t }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col h-full rounded-lg border transition-colors ${isOver ? 'bg-primary/5 border-primary/50' : 'border-transparent bg-transparent'}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm">{title}</div>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {deals.length}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 rounded-lg p-2 min-h-[500px] bg-muted/30">
        {deals.map(deal => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onClick={onDealClick} 
          />
        ))}
        {deals.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-50">
            <p className="text-xs text-muted-foreground">{t('sales.empty.description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SalesPipelinePage() {
  const { t } = useTranslation();
  const { data: deals = [], isLoading, refetch } = useSalesPipeline();
  const [activeDeal, setActiveDeal] = useState<SalesDeal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<SalesDeal | null>(null);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Re-use project hooks to get contractors, references, and save handlers for the creation sheet
  const { contractors, references, handleSaveProject } = useProjectsPage();

  const handleSaveDeal = async (project: Project) => {
    await handleSaveProject(project);
    setIsCreateOpen(false);
    refetch();
  };

  const actions = (
    <Button className="gap-2 h-9" onClick={() => setIsCreateOpen(true)}>
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">{t("sales.new_deal")}</span>
    </Button>
  );

  usePageSettings({
    title: t("sales.title"),
    subtitle: t("sales.subtitle"),
    breadcrumbs: [{ label: t("sales.title") }],
    actions,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const stages: { id: SalesStage; title: string }[] = [
    { id: 'lead', title: t('sales.stages.lead') },
    { id: 'negotiation', title: t('sales.stages.negotiation') },
    { id: 'quote', title: t('sales.stages.quote') },
    { id: 'contract', title: t('sales.stages.contract') },
    { id: 'won', title: t('sales.stages.won') },
    { id: 'lost', title: t('sales.stages.lost') },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find(d => d.id.toString() === active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (over && active.id !== over.id) {
      const dealId = Number(active.id);
      const newStage = over.id as SalesStage;
      
      try {
        await api.put(`/projects/${dealId}`, { stage: newStage });
        refetch();
      } catch (error) {
        console.error("Failed to update deal stage", error);
      }
    }
  };

  const handleDealClick = (deal: SalesDeal) => {
    setSelectedDeal(deal);
    setIsHubOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDeal(null)}
      >
        <ScrollArea className="h-full w-full whitespace-nowrap rounded-md border bg-muted/10 p-4">
          <div className="flex space-x-4 pb-4 h-full min-h-[600px]">
            {stages.map((stage) => (
              <DroppableColumn 
                key={stage.id}
                id={stage.id}
                title={stage.title}
                deals={deals.filter(d => (d.stage || 'lead') === stage.id)}
                onDealClick={handleDealClick}
                t={t}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {createPortal(
          <DragOverlay>
            {activeDeal ? (
              <DealCard 
                deal={activeDeal} 
                onClick={() => {}} 
                isOverlay 
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <DealHubSheet 
        deal={selectedDeal}
        open={isHubOpen}
        onOpenChange={setIsHubOpen}
      />

      {isCreateOpen && (
        <ProjectSheet
          project={null}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSave={handleSaveDeal}
          contractors={contractors}
          references={references}
          defaultValues={{ project_type: 'sales_deal', stage: 'lead' }}
        />
      )}
    </div>
  );
}
