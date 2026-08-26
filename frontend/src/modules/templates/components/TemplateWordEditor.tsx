import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Table as TableIcon, Trash2
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        data-active={editor.isActive('bold')}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        data-active={editor.isActive('italic')}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
        data-active={editor.isActive('underline')}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
        data-active={editor.isActive('strike')}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
        data-active={editor.isActive({ textAlign: 'left' })}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
        data-active={editor.isActive({ textAlign: 'center' })}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
        data-active={editor.isActive({ textAlign: 'right' })}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run(); }}
        data-active={editor.isActive({ textAlign: 'justify' })}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        data-active={editor.isActive('bulletList')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        data-active={editor.isActive('orderedList')}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
      >
        <Redo className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />
      <select 
        className="h-8 border rounded text-sm px-2 bg-transparent"
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        value={editor.getAttributes('textStyle').fontFamily || ''}
      >
        <option value="">Шрифт</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier</option>
        <option value="Georgia">Georgia</option>
      </select>
      <input
        type="color"
        onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="h-8 w-8 p-0 border rounded cursor-pointer"
        title="Цвет текста"
      />

      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}
        title="Вставить таблицу (3x3)"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-destructive"
        onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
        disabled={!editor.can().deleteTable()}
        title="Удалить таблицу"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const TemplateWordEditor = ({ content, onChange }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[297mm] w-full',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only set content if it's an external update (e.g. initial load or variable insertion)
      // to avoid cursor jumping while typing
      if (!editor.isFocused || content.length > editor.getHTML().length + 5) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col border rounded-md overflow-hidden bg-[#f3f3f3] h-[600px] w-full">
      <MenuBar editor={editor} />
      
      {/* Fake Ruler */}
      <div className="h-6 bg-white border-b flex items-center justify-center relative overflow-hidden select-none shrink-0">
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10mm 100%' }} />
        <div className="absolute top-0 bottom-0 left-[50%] w-px bg-red-500/50" />
      </div>

      {/* A4 Page Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center w-full cursor-text"
        onClick={(e) => {
          // Focus editor if clicked on the grey background or white page padding
          if (editor && !editor.isFocused) {
            editor.chain().focus().run();
          }
        }}
      >
        <div className="bg-white shadow-lg shrink-0 w-[210mm] min-h-[297mm] p-[20mm]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
