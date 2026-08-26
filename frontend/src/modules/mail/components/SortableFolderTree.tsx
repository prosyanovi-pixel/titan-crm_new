import React, { useMemo, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  GripVertical,
  Inbox,
  Send,
  FileText,
  Archive,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { 
  getCanonicalSystemKey, 
  systemFolderNames, 
  isSystemFolder 
} from '../utils/componentUtils';
import { useMailContext } from '../context/useMailContext';
import { ApiMailFolder } from '../types';

// Маппинг иконок для системных папок
const systemIcons: Record<string, React.ElementType> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  spam: AlertCircle,
  trash: Trash2,
};

interface SortableItemProps {
  id: string;
  folder: ApiMailFolder & { children?: (ApiMailFolder & { children?: unknown })[] };
  depth: number;
  onContextMenu: (e: React.MouseEvent, folder: ApiMailFolder & { children?: (ApiMailFolder & { children?: unknown })[] }) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  renderChildren: (parentId: string, depth: number) => React.ReactNode;
}

function SortableFolderItem({ 
  id, 
  folder, 
  depth, 
  onContextMenu, 
  isExpanded, 
  onToggleExpand,
  renderChildren
}: SortableItemProps) {
  const { activeFolder, setActiveFolder, setViewMode } = useMailContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: '0px',
    opacity: isDragging ? 0.4 : 1,
  };

  const isSelected = activeFolder === folder.id;
  const canonicalKey = getCanonicalSystemKey(folder);
  const displayName = isSystemFolder(folder.folderType) 
    ? (systemFolderNames[canonicalKey] || folder.folderName) 
    : folder.folderName;

  const hasChildren = folder.children && folder.children.length > 0;
  
  // Выбираем иконку: системная или обычная папка
  const Icon = systemIcons[canonicalKey] || Folder;

  return (
    <div ref={setNodeRef} style={style} className="group flex flex-col">
      <div 
        className={cn(
          "flex items-center w-full rounded-md transition-all h-9 px-2.5 gap-2.5 mb-0.5 relative group/item",
          isSelected ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        {/* Grip Icon - Absolute and to the left */}
        <button 
          {...attributes} 
          {...listeners} 
          className="absolute -left-1.5 opacity-0 group-hover/item:opacity-30 hover:opacity-100 cursor-grab active:cursor-grabbing p-1 transition-opacity"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        
        {/* Chevron - Absolute and to the left of the icon */}
        <div 
          className={cn(
            "absolute -left-1 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-primary/10 transition-colors cursor-pointer z-10",
            !hasChildren && "invisible"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(folder.id);
          }}
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
        
        <div 
          className="flex-1 flex items-center gap-2.5 min-w-0 cursor-pointer"
          onClick={() => {
            setActiveFolder(folder.id);
            setViewMode('list');
            if (hasChildren) {
              onToggleExpand(folder.id);
            }
          }}
        >
          <Icon className={cn(
            "h-4 w-4 shrink-0 transition-colors", 
            isSelected ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
          )} />
          <span className="truncate text-sm tracking-tight">{displayName}</span>
        </div>

        {folder.unseenCount > 0 && (
          <Badge variant="secondary" className="px-1.5 h-4 min-w-[18px] flex items-center justify-center text-[10px] bg-primary/10 text-primary border-none font-black rounded-full">
            {folder.unseenCount}
          </Badge>
        )}
      </div>

      {hasChildren && isExpanded && renderChildren(folder.id, depth + 1)}
    </div>
  );
}

export function SortableFolderTree({ folders, type }: { folders: ApiMailFolder[], type: 'system' | 'custom' }) {
  const { moveFolder, selectedAccountId } = useMailContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  interface FolderNode extends ApiMailFolder {
    children: FolderNode[];
  }

  const folderTree = useMemo(() => {
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];
    folders.forEach(f => {
      map.set(f.id, { ...f, children: [] });
    });
    folders.forEach(f => {
      const node = map.get(f.id);
      if (node) {
        const parentId = f.parentFolderId || f.parent_folder_id;
        if (parentId && map.has(parentId)) {
          const parent = map.get(parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      }
    });
    return roots;
  }, [folders]);

  const allFolderIds = useMemo(() => folders.map(f => f.id), [folders]);

  const toggleExpand = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const newIndex = allFolderIds.indexOf(over.id as string);
      await moveFolder(active.id as string, null, newIndex);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, folder: ApiMailFolder & { children?: unknown }) => {
    e.preventDefault();
    e.stopPropagation();
    const event = new CustomEvent('mail-folder-context-menu', { 
      detail: { event: { clientX: e.clientX, clientY: e.clientY }, folder: { ...folder, accountId: selectedAccountId } } 
    });
    window.dispatchEvent(event);
  };

  const renderNodes = (nodes: FolderNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <SortableFolderItem 
        key={node.id} 
        id={node.id} 
        folder={node} 
        depth={depth} 
        onContextMenu={handleContextMenu}
        isExpanded={expandedFolders.has(node.id)}
        onToggleExpand={toggleExpand}
        renderChildren={(parentId, childDepth) => renderNodes(node.children, childDepth)}
      />
    ));
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allFolderIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {renderNodes(folderTree)}
        </div>
      </SortableContext>
      
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <div className="flex items-center h-9 px-4 bg-background border border-primary/20 rounded-md shadow-2xl opacity-90 pointer-events-none ring-2 ring-primary/20">
            <Folder className="h-4 w-4 mr-2 text-primary fill-primary/10" />
            <span className="text-sm font-bold truncate">
              {folders.find(f => f.id === activeId)?.folderName}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
