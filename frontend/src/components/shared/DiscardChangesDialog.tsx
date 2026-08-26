import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onDiscard: () => void;
  onSave: () => void;
  title?: string;
  description?: string;
}

export function DiscardChangesDialog({
  open,
  onOpenChange,
  onContinue,
  onDiscard,
  onSave,
  title,
  description,
}: DiscardChangesDialogProps) {
  const { t } = useTranslation();

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleContinue = () => {
    onContinue();
    handleOpenChange(false);
  };

  const handleDiscard = () => {
    onDiscard();
    handleOpenChange(false);
  };

  const handleSave = () => {
    onSave();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {title || t('common.discard_changes_dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {description || t('common.discard_changes_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleContinue}>
            {t('common.discard_changes_dialog.continue_editing')}
          </Button>
          <Button variant="destructive" onClick={handleDiscard}>
            {t('common.discard_changes_dialog.discard_changes')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
