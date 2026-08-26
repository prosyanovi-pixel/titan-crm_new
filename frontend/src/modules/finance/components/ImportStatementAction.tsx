import React, { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useImportStatement } from '../hooks/useFinance';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ImportPreviewDialog } from './ImportPreviewDialog';

const SUPPORTED_IMPORT_EXTENSIONS = ['csv', 'txt'];

// ───────── Import dialog (вынесен из BankStatementsTab) ─────────
function ImportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const importFn = useImportStatement();
  const [importType, setImportType] = useState<'csv' | '1c_txt'>('csv');
  const [account, setAccount] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractAccountFromFileName = (name: string): string | null => {
    const match = name.match(/(\d{20})/);
    return match ? match[1] : null;
  };

  const decodeFile = (file: File, type: 'csv' | '1c_txt') => {
    const reader = new FileReader();
    reader.onload = ev => {
      const buffer = ev.target?.result as ArrayBuffer;
      const encoding = type === '1c_txt' ? 'windows-1251' : 'utf-8';
      try {
        const decoder = new TextDecoder(encoding);
        setFileContent(decoder.decode(buffer));
      } catch {
        const fallback = new TextDecoder('utf-8');
        setFileContent(fallback.decode(buffer));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_IMPORT_EXTENSIONS.includes(extension)) {
      toast.error('Поддерживаются только CSV и TXT файлы');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setRawFile(file);
    const lowerName = file.name.toLowerCase();
    const detectedType: 'csv' | '1c_txt' =
      lowerName.endsWith('.txt') || lowerName.includes('1c') ? '1c_txt' : 'csv';
    setImportType(detectedType);
    const extractedAccount = extractAccountFromFileName(file.name);
    if (extractedAccount) setAccount(extractedAccount);
    decodeFile(file, detectedType);
  };

  const handleTypeChange = (v: string) => {
    const type = v as 'csv' | '1c_txt';
    setImportType(type);
    if (rawFile) decodeFile(rawFile, type);
  };

  const handlePreview = async () => {
    if (!fileContent) {
      toast.error(t('generated.vyberite_fayl'));
      return;
    }
    try {
      const result = await importFn.mutateAsync({
        content: fileContent,
        fileName,
        importType,
        account: account || undefined,
        draft: true,
      });
      if (result.mode === 'preview' && result.preview) {
        setPreview(result.preview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirm = async () => {
    if (!fileContent) return;
    try {
      await importFn.mutateAsync({
        content: fileContent,
        fileName,
        importType,
        account: account || undefined,
        draft: false,
      });
      setShowPreview(false);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = () => {
    setShowPreview(false);
    setPreview(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('finance.statement.import')}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.import_type')}</label>
              <Select value={importType} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{t('finance.statement.import_type_csv')}</SelectItem>
                  <SelectItem value="1c_txt">{t('finance.statement.import_type_1c')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.account')}</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                placeholder={t('generated.raschetnyy_schet_bank_optsional_no')}
                value={account}
                onChange={e => setAccount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t('finance.statement.file_name')}</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {fileName ? <div className="text-sm font-medium">{fileName}</div> : (
                  <div className="text-muted-foreground text-sm">
                    <Upload className="w-6 h-6 mx-auto mb-2" />
                    {t('generated.nazhmite_dlya_vybora_fayla_csv_txt')}
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('generated.otmena')}</Button>
            <Button variant="secondary" onClick={handlePreview} disabled={importFn.isPending || !fileContent}>
              👁️ Предпросмотр
            </Button>
            <Button onClick={handleConfirm} disabled={importFn.isPending || !fileContent}>
              {importFn.isPending ? 'Импорт…' : 'Импортировать'}
            </Button>
          </div>
        </div>
      </div>
      {showPreview && preview && (
        <ImportPreviewDialog
          open={showPreview}
          onOpenChange={(open) => { if (!open) { setShowPreview(false); setPreview(null); } }}
          preview={preview}
          onConfirm={handleConfirm}
          onReject={handleReject}
          isPending={importFn.isPending}
        />
      )}
    </>
  );
}

export function ImportStatementAction() {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <Button variant="outline" className="gap-2 h-9" onClick={() => setShowImport(true)}>
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">{t('finance.statement.import')}</span>
      </Button>
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </>
  );
}
