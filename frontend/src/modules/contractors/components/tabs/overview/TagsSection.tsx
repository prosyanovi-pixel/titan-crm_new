import React from "react";
import { 
  Tag as TagIcon, 
  Plus, 
  Search 
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag as TagComponent } from "@/components/ui/status-system/Tag";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Contractor } from "../../../types/contractor.types";
import { TagItem } from "@/modules/settings/types/settings.types";

interface TagsSectionProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  availableTags: TagItem[];
  tagSearch: string;
  setTagSearch: (val: string) => void;
}

export const TagsSection = ({
  formData,
  handleChange,
  availableTags,
  tagSearch,
  setTagSearch,
}: TagsSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1 pt-4">
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2">
        <TagIcon className="w-3.5 h-3.5" />
        {t('contractor_sheet.field.tags')}
      </div>

      <div className="px-2 flex flex-wrap gap-2 min-h-[44px] items-center bg-muted/20 rounded-xl p-3 border border-dashed transition-all hover:bg-muted/30">
        {formData.tags && formData.tags.length > 0 ? (
          formData.tags.map((tag, index) => {
            const tagConfig = availableTags.find(t => t.name === tag || t.id === tag);
            return (
              <TagComponent
                key={tagConfig?.id || `${tag}-${index}`}
                name={tagConfig?.name || tag}
                color={tagConfig?.color}
                onRemove={() => {
                  const newTags = [...(formData.tags || [])];
                  newTags.splice(index, 1);
                  handleChange("tags", newTags);
                }}
              />
            );
          })
        ) : (
          <span className="text-[10px] text-muted-foreground italic px-1">{t('contractor_sheet.placeholder.no_tags')}</span>
        )}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-3 rounded-full border-dashed text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all">
              <Plus className="w-3.5 h-3.5" />
              {t('common.add')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 shadow-xl border-primary/10" align="start" side="top">
             <div className="space-y-3">
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                      placeholder={t('contractor_sheet.placeholder.search_tag')} 
                      value={tagSearch} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagSearch(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && tagSearch.trim()) {
                              const current = formData.tags || [];
                              if (!current.includes(tagSearch.trim())) {
                                  handleChange("tags", [...current, tagSearch.trim()]);
                                  setTagSearch("");
                              }
                          }
                      }}
                      className="h-9 pl-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                      autoFocus
                  />
               </div>
               
               <ScrollArea className="max-h-48 pr-2">
                  <div className="grid gap-1">
                      {availableTags
                          .filter(t => !formData.tags?.includes(t.id) && !formData.tags?.includes(t.name) && (tagSearch === "" || t.name.toLowerCase().includes(tagSearch.toLowerCase())))
                          .map(tag => (
                              <Button
                                  key={tag.id}
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start font-normal h-8 text-xs px-2 hover:bg-primary/5"
                                  onClick={() => {
                                      const current = formData.tags || [];
                                      if (!current.includes(tag.id)) {
                                          handleChange("tags", [...current, tag.id]);
                                      }
                                  }}
                              >
                                  <div className="w-2 h-2 rounded-full mr-2.5 shadow-sm" style={{ backgroundColor: tag.color }} />
                                  {tag.name}
                              </Button>
                          ))
                      }
                      {tagSearch.trim() && !availableTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                          <Button 
                              variant="secondary" 
                              size="sm" 
                              className="justify-start font-bold h-9 text-[10px] px-2 mt-1 bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10"
                              onClick={() => {
                                  const current = formData.tags || [];
                                  if (!current.includes(tagSearch.trim())) {
                                      handleChange("tags", [...current, tagSearch.trim()]);
                                      setTagSearch("");
                                  }
                              }}
                          >
                              <Plus className="w-3 h-3 mr-2" />
                              {t('contractor_sheet.action.add_custom_tag', { tag: tagSearch })}
                          </Button>
                      )}
                      {availableTags.filter(t => !formData.tags?.includes(t.id) && !formData.tags?.includes(t.name)).length === 0 && !tagSearch && (
                          <p className="text-[10px] text-center text-muted-foreground py-4 italic">{t('contractor_sheet.placeholder.no_tags_found')}</p>
                      )}
                  </div>
               </ScrollArea>
             </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
