import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreVertical, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface CategoryNode {
  id: number;
  name: string;
  parent_id: number | null;
  children: CategoryNode[];
  [key: string]: any;
}

export interface CategoryTreeProps {
  data: CategoryNode[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAddCategory: (parentId: number | null) => void;
  onEditCategory: (category: CategoryNode) => void;
  onDeleteCategory: (category: CategoryNode) => void;
}

export function CategoryTree({
  data,
  selectedId,
  onSelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryTreeProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <h3 className="font-semibold text-sm">{t('components.category_tree.catalog')}</h3>
        <Button variant="ghost" size="icon" onClick={() => onAddCategory(null)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div 
          className={cn(
            "flex items-center px-2 py-1.5 rounded-md cursor-pointer text-sm mb-2",
            selectedId === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-slate-100 text-slate-700"
          )}
          onClick={() => onSelect(null)}
        >
          <Folder className="h-4 w-4 mr-2 text-slate-400" />
          {t('components.category_tree.all_content')}
        </div>
        
        {data.length === 0 ? (
          <div className="text-sm text-slate-500 text-center p-4">{t('components.category_tree.no_categories')}</div>
        ) : (
          data.map(node => (
            <TreeNode 
              key={node.id} 
              node={node} 
              level={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: CategoryNode;
  level: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAddCategory: (parentId: number | null) => void;
  onEditCategory: (category: CategoryNode) => void;
  onDeleteCategory: (category: CategoryNode) => void;
}

function TreeNode({ node, level, selectedId, onSelect, onAddCategory, onEditCategory, onDeleteCategory }: TreeNodeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center group px-2 py-1 rounded-md cursor-pointer text-sm my-0.5",
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-slate-100 text-slate-700"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleSelect}
      >
        <div 
          className="w-5 h-5 flex items-center justify-center mr-1 cursor-pointer opacity-70 hover:opacity-100"
          onClick={handleToggle}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4 h-4" /> // empty space
          )}
        </div>
        
        {expanded ? (
          <FolderOpen className={cn("h-4 w-4 mr-2", isSelected ? "text-primary-foreground" : "text-sky-500")} />
        ) : (
          <Folder className={cn("h-4 w-4 mr-2", isSelected ? "text-primary-foreground" : "text-sky-500")} />
        )}
        
        <span className="flex-1 truncate">{node.name}</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", isSelected && "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground")}
              onClick={e => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddCategory(node.id); }}>
              <Plus className="h-4 w-4 mr-2" /> {t('components.category_tree.add_nested')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditCategory(node); }}>
              <Edit className="h-4 w-4 mr-2" /> {t('components.category_tree.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDeleteCategory(node); }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" /> {t('components.category_tree.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddCategory={onAddCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
