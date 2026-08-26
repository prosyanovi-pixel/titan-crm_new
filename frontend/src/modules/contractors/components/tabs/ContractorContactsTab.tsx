import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Phone, Mail, Trash2, Plus, Briefcase, User, Globe, X, Check, Search, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Contractor, ContactPerson } from "../../types/contractor.types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContractorSelect } from "@/components/shared/ContractorSelect";

interface ContractorContactsTabProps {
  formData: Partial<Contractor>;
  handleChange: (field: keyof Contractor, value: unknown) => void;
  isCreating?: boolean;
}

export function ContractorContactsTab({ formData, handleChange, isCreating = false }: ContractorContactsTabProps) {
  const { t } = useTranslation();
  const { getPositions } = useSettings();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<Partial<ContactPerson>>({});
  const [posSearch, setPosSearch] = useState("");

  const availablePositions = getPositions().map(p => p.name);
  const filteredPositions = availablePositions.filter(p => 
    p.toLowerCase().includes(posSearch.toLowerCase())
  );

  const resetForm = () => {
    setContactForm({});
    setIsAdding(false);
    setEditingId(null);
    setPosSearch("");
  };

  const handleStartAdd = () => {
    setContactForm({ isPrimary: (formData.contacts || []).length === 0 });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (contact: ContactPerson) => {
    setContactForm({ ...contact });
    setEditingId(contact.id);
    setIsAdding(false);
  };

  const handleSaveContact = () => {
    if (!contactForm.name?.trim()) return;

    const currentContacts = formData.contacts || [];
    let updatedContacts: ContactPerson[];

    if (editingId) {
      updatedContacts = currentContacts.map(c => 
        c.id === editingId ? { ...c, ...contactForm as ContactPerson } : c
      );
    } else {
      const newContact: ContactPerson = {
        id: Math.random().toString(36).substr(2, 9),
        name: contactForm.name!,
        position: contactForm.position || "",
        phone: contactForm.phone || "",
        email: contactForm.email || "",
        isPrimary: contactForm.isPrimary || currentContacts.length === 0,
        personId: contactForm.personId,
      };
      updatedContacts = [...currentContacts, newContact];
    }

    // Если этот контакт основной, снимаем флаг с других
    if (contactForm.isPrimary) {
      const targetId = editingId || updatedContacts[updatedContacts.length - 1].id;
      updatedContacts = updatedContacts.map(c => ({
        ...c,
        isPrimary: c.id === targetId
      }));
    }

    handleChange("contacts", updatedContacts);
    resetForm();
  };

  const removeContact = (id: string) => {
    const updatedContacts = (formData.contacts || []).filter(c => c.id !== id);
    // Если удалили основной, назначаем первый попавшийся основным
    if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
      updatedContacts[0].isPrimary = true;
    }
    handleChange("contacts", updatedContacts);
  };

  const renderForm = (isEdit: boolean) => (
    <div className="border-2 border-primary/20 rounded-xl p-4 bg-primary/5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('contractor_sheet.field.contact_name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9 h-10 bg-background"
              value={contactForm.name || ""} 
              onChange={(e) => setContactForm({...contactForm, name: e.target.value})} 
              placeholder={t('contractor_sheet.placeholder.contact_name')}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('contractor_sheet.field.contact_position')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-10 font-normal bg-background">
                {contactForm.position || t('generated.vyberite_dolzhnost')}
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('contractor_sheet.placeholder.search_or_new')}
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredPositions.map(p => (
                    <Button
                      key={p}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => {
                        setContactForm({...contactForm, position: p});
                        setPosSearch("");
                      }}
                    >
                      {p}
                    </Button>
                  ))}
                  {posSearch.trim() && !availablePositions.includes(posSearch.trim()) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start text-xs h-8 bg-primary/5 text-primary"
                      onClick={() => {
                        setContactForm({...contactForm, position: posSearch.trim()});
                        setPosSearch("");
                      }}
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      {t('contractor_sheet.action.create_position', { position: posSearch })}
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('contractor_sheet.field.contact_phone')}</Label>
          <MaskedInput 
            value={contactForm.phone || ""} 
            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} 
            className="h-10 bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('contractor_sheet.field.contact_email')}</Label>
          <Input 
            value={contactForm.email || ""} 
            onChange={(e) => setContactForm({...contactForm, email: e.target.value})} 
            placeholder="email@example.com"
            className="h-10 bg-background"
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('contractor.linked_person')}</Label>
        <ContractorSelect
          value={contactForm.personId}
          onValueChange={(id) => setContactForm({...contactForm, personId: id || undefined})}
          isPrivateOnly={true}
          placeholder={t("contractor.select_linked_person")}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-primary/10">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={contactForm.isPrimary} 
            onChange={(e) => setContactForm({...contactForm, isPrimary: e.target.checked})}
            className="h-4 w-4 rounded border-primary/30"
          />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {t('generated.osnovnoy_kontakt')}
          </span>
        </label>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={resetForm} className="h-8">
            <X className="w-4 h-4 mr-1" />
            {t('contractor_sheet.action.cancel')}
          </Button>
          <Button size="sm" onClick={handleSaveContact} className="h-8 px-4 bg-primary hover:bg-primary/90 shadow-md">
            <Check className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Список контактов */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {!isCreating && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="w-4 h-4 text-primary" />
              {t('contractor_sheet.section.contacts')}
            </div>
          )}
          
          {!isAdding && !editingId && (
            <Button size="sm" onClick={handleStartAdd} className="h-8 gap-1.5 font-bold shadow-sm">
              <Plus className="w-4 h-4" />
              {t('contractor_sheet.action.add_contact')}
            </Button>
          )}
        </div>

        {/* Форма добавления */}
        {isAdding && renderForm(false)}

        <div className="grid grid-cols-1 gap-3">
          {formData.contacts?.map((contact) => (
            editingId === contact.id ? (
              <div key={contact.id}>{renderForm(true)}</div>
            ) : (
              <div 
                key={contact.id} 
                className="group border rounded-xl p-3 bg-card hover:border-primary/50 transition-all cursor-pointer relative"
                onClick={() => handleStartEdit(contact)}
              >
                <div className="flex gap-3 items-start">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-sm truncate">{contact.name}</span>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] uppercase font-black bg-blue-500/10 text-blue-600 border-blue-500/20">
                            {t('generated.osnovnoy')}
                          </Badge>
                        )}
                        {contact.personId && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[9px] uppercase font-black">
                            {t('contractor.linked_person_badge')}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContact(contact.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                      {contact.position && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-primary/60" />
                          <span className="font-medium">{contact.position}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-500/60" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-blue-500/60" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}

          {(!formData.contacts || formData.contacts.length === 0) && !isAdding && (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/5">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
              {t('contractor_sheet.placeholder.no_contacts')}
            </div>
          )}
        </div>
      </div>

      {/* Контакты организации (Website/Email) */}
      <div className="pt-4 border-t border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
              {t('contractor_sheet.field.email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                className="pl-9 h-10 bg-muted/5"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@company.ru"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
              {t('contractor_sheet.field.website')}
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                className="pl-9 h-10 bg-muted/5"
                value={formData.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="company.ru"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
