import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { ApiMailFolder } from '../types';
import { 
  isSystemFolder, 
  getCanonicalSystemKey, 
  systemFolderNames 
} from '../utils/componentUtils';
import { 
  Inbox, 
  Send, 
  FileText, 
  Archive, 
  AlertCircle, 
  Trash2, 
  Folder,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FolderTreeMenuProps {
  /** Список папок (плоский) */
  folders: ApiMailFolder[];
  /** Колбэк при выборе папки */
  onSelectFolder: (folderId: string) => void;
  /** ID текущей выбранной папки (для подсветки) */
  selectedFolderId?: string;
  /** Глубина отступа (больше не используется для подменю, но оставлена для совместимости) */
  baseIndent?: number;
  /** Показывать только видимые папки (isVisible !== false) */
  onlyVisible?: boolean;
  /** Разделять системные и пользовательские папки */
  separateSystemFolders?: boolean;
  /** Рендерить как кнопки (button) или как элементы списка (div) */
  renderAs?: 'button' | 'div';
  /** Дополнительный CSS-класс для контейнера */
  className?: string;
}

const systemFolderIcons: Record<string, React.ReactNode> = {
  inbox: <Inbox className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  drafts: <FileText className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
  spam: <AlertCircle className="h-4 w-4" />,
  trash: <Trash2 className="h-4 w-4" />,
};

/**
 * Внутренний компонент для отдельного пункта меню папки.
 * Управляет отображением собственного подменю при наведении с проверкой границ экрана.
 */
function FolderTreeItem({ 
  node, 
  onSelectFolder, 
  selectedFolderId, 
  renderAs 
}: { 
  node: any; 
  onSelectFolder: (id: string) => void; 
  selectedFolderId?: string;
  renderAs: 'button' | 'div';
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [submenuStyle, setSubmenuStyle] = useState<React.CSSProperties>({ left: '100%', top: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFolderId === node.id;
  const canonicalKey = getCanonicalSystemKey(node);
  
  // Корректное получение имени папки
  const displayName = isSystemFolder(node.folderType) 
    ? (systemFolderNames[canonicalKey] || systemFolderNames[node.folderName] || node.folderName) 
    : node.folderName;
  
  const icon = systemFolderIcons[canonicalKey] || <Folder className="h-4 w-4" />;

  // Расчет позиции подменю при наведении
  useLayoutEffect(() => {
    if (isHovered && hasChildren && itemRef.current && submenuRef.current) {
      const itemRect = itemRef.current.getBoundingClientRect();
      const submenuRect = submenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Если ширина 0 (еще не отрисовано), пропускаем этот шаг
      if (submenuRect.width === 0) return;

      const newStyle: React.CSSProperties = { top: 0, left: '100%', right: 'auto' };

      // Проверка правой границы экрана
      if (itemRect.right + submenuRect.width > viewportWidth - 5) {
        newStyle.left = 'auto';
        newStyle.right = '100%';
      }

      // Проверка нижней границы экрана
      if (itemRect.top + submenuRect.height > viewportHeight - 5) {
        const overflow = (itemRect.top + submenuRect.height) - (viewportHeight - 5);
        newStyle.top = -overflow;
      }

      setSubmenuStyle(newStyle);
    }
  }, [isHovered, hasChildren]);

  return (
    <div 
      ref={itemRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "group flex items-center w-full rounded-sm transition-colors hover:bg-accent focus-within:bg-accent cursor-pointer",
          isSelected && "bg-accent font-medium"
        )}
      >
        {renderAs === 'button' ? (
          <button
            type="button"
            className="flex-1 flex items-center px-2 py-1.5 text-sm text-left truncate outline-none"
            onClick={() => onSelectFolder(node.id)}
            title={displayName}
          >
            <span className="mr-2 opacity-70 shrink-0">{icon}</span>
            <span className="truncate flex-1">{displayName}</span>
            {hasChildren && <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-50 shrink-0" />}
          </button>
        ) : (
          <div
            className="flex-1 flex items-center px-2 py-1.5 text-sm text-left truncate outline-none cursor-default select-none"
            onClick={() => onSelectFolder(node.id)}
            title={displayName}
          >
            <span className="mr-2 opacity-70 shrink-0">{icon}</span>
            <span className="truncate flex-1">{displayName}</span>
            {hasChildren && <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-50 shrink-0" />}
          </div>
        )}
      </div>

      {hasChildren && isHovered && (
        <div 
          ref={submenuRef}
          style={submenuStyle}
          className="absolute z-[1000] bg-popover border rounded-md shadow-md py-1 min-w-[200px]"
        >
          {node.children.map((child: any) => (
            <FolderTreeItem 
              key={child.id} 
              node={child} 
              onSelectFolder={onSelectFolder} 
              selectedFolderId={selectedFolderId}
              renderAs={renderAs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Универсальный компонент для отображения дерева папок с подменю.
 * Использует рекурсивные подменю, открывающиеся вправо при наведении.
 */
export function FolderTreeMenu({
  folders,
  onSelectFolder,
  selectedFolderId,
  onlyVisible = true,
  separateSystemFolders = false,
  renderAs = 'button',
  className = '',
}: FolderTreeMenuProps) {
  // Построение дерева папок
  const folderTree = useMemo(() => {
    const flat = onlyVisible
      ? folders.filter(f => f.isVisible !== false)
      : [...folders];

    const map = new Map<string, any>();
    const roots: any[] = [];

    flat.forEach(f => {
      map.set(f.id, { ...f, children: [] });
    });

    flat.forEach(f => {
      const node = map.get(f.id);
      if (f.parentFolderId && map.has(f.parentFolderId)) {
        const parent = map.get(f.parentFolderId);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [folders, onlyVisible]);

  // Разделение на системные и пользовательские папки
  const { systemTree, customTree } = useMemo(() => {
    if (!separateSystemFolders) {
      return { systemTree: [], customTree: folderTree };
    }

    const systemRoots = folderTree.filter(node => isSystemFolder(node.folderType));
    const customRoots = folderTree.filter(node => !isSystemFolder(node.folderType));

    return { systemTree: systemRoots, customTree: customRoots };
  }, [folderTree, separateSystemFolders]);

  const renderNodes = (nodes: any[]) => {
    return nodes.map(node => (
      <FolderTreeItem 
        key={node.id} 
        node={node} 
        onSelectFolder={onSelectFolder} 
        selectedFolderId={selectedFolderId}
        renderAs={renderAs}
      />
    ));
  };

  return (
    <div className={cn("flex flex-col min-w-[200px] overflow-visible", className)}>
      {separateSystemFolders ? (
        <>
          {systemTree.length > 0 && renderNodes(systemTree)}
          {systemTree.length > 0 && customTree.length > 0 && (
            <div className="mx-2 my-1 h-px shrink-0 bg-border" />
          )}
          {customTree.length > 0 && renderNodes(customTree)}
        </>
      ) : (
        renderNodes(folderTree)
      )}
    </div>
  );
}