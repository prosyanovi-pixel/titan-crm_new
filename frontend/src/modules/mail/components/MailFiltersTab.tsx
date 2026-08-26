import React, { useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MailFilterList } from './MailFilterList';
import { MailFilterForm } from './MailFilterForm';
import {
  MailFilter,
  FilterCondition,
  DEFAULT_CONDITION,
} from './MailFilterTypes';

interface MailFiltersTabProps {
  accountId: string;
}

type State = {
  filters: MailFilter[];
  folders: any[];
  loading: boolean;
  dialogOpen: boolean;
  editingFilter: MailFilter | null;
  applyingFilter: string | null;
  // Form fields
  filterName: string;
  description: string;
  matchType: 'all' | 'any';
  conditions: FilterCondition[];
  targetFolderId: string;
  applyStar: boolean;
  applyRead: boolean;
  deleteMail: boolean;
  forwardTo: string;
};

type Action =
  | { type: 'SET_FILTERS'; payload: MailFilter[] }
  | { type: 'SET_FOLDERS'; payload: any[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'OPEN_DIALOG'; payload: MailFilter | null }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_APPLYING'; payload: string | null }
  | { type: 'UPDATE_FIELD'; field: string; value: any }
  | { type: 'ADD_CONDITION' }
  | { type: 'REMOVE_CONDITION'; index: number }
  | { type: 'UPDATE_CONDITION'; index: number; field: keyof FilterCondition; value: string | boolean };

const initialState: State = {
  filters: [],
  folders: [],
  loading: false,
  dialogOpen: false,
  editingFilter: null,
  applyingFilter: null,
  filterName: '',
  description: '',
  matchType: 'any',
  conditions: [DEFAULT_CONDITION],
  targetFolderId: '',
  applyStar: false,
  applyRead: false,
  deleteMail: false,
  forwardTo: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FILTERS': return { ...state, filters: action.payload };
    case 'SET_FOLDERS': return { ...state, folders: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'OPEN_DIALOG':
      if (action.payload) {
        const f = action.payload;
        return {
          ...state,
          dialogOpen: true,
          editingFilter: f,
          filterName: f.filterName,
          description: f.description || '',
          matchType: f.matchType,
          conditions: f.conditions?.length ? f.conditions : [DEFAULT_CONDITION],
          targetFolderId: f.targetFolderId || '',
          applyStar: f.applyStar || false,
          applyRead: f.applyRead || false,
          deleteMail: f.deleteMail || false,
          forwardTo: f.forwardTo || '',
        };
      }
      return { ...initialState, filters: state.filters, folders: state.folders, dialogOpen: true };
    case 'CLOSE_DIALOG': return { ...state, dialogOpen: false };
    case 'SET_APPLYING': return { ...state, applyingFilter: action.payload };
    case 'UPDATE_FIELD': return { ...state, [action.field]: action.value };
    case 'ADD_CONDITION': return { ...state, conditions: [...state.conditions, { ...DEFAULT_CONDITION }] };
    case 'REMOVE_CONDITION':
      if (state.conditions.length > 1) {
        return { ...state, conditions: state.conditions.filter((_, i) => i !== action.index) };
      }
      return state;
    case 'UPDATE_CONDITION': {
      const newConditions = [...state.conditions];
      newConditions[action.index] = { ...newConditions[action.index], [action.field]: action.value };
      return { ...state, conditions: newConditions };
    }
    default: return state;
  }
}

export function MailFiltersTab({ accountId }: MailFiltersTabProps) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filters, folders, loading, dialogOpen, editingFilter, applyingFilter, filterName, description, matchType, conditions, targetFolderId, applyStar, applyRead, deleteMail, forwardTo } = state;

  const fetchFilters = useCallback(async () => {
    if (!accountId) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get(`/mail/filters/${accountId}`);
      dispatch({ type: 'SET_FILTERS', payload: response });
    } catch (error) {
      toast.error(t('mail.errors.load_failed'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [accountId, t]);

  useEffect(() => {
    if (!accountId) return;
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [filtersRes, foldersRes] = await Promise.all([
          api.get(`/mail/filters/${accountId}`),
          api.get(`/mail/folders/${accountId}`),
        ]);
        dispatch({ type: 'SET_FILTERS', payload: filtersRes });
        dispatch({ type: 'SET_FOLDERS', payload: foldersRes });
      } catch (error) {
        toast.error(t('mail.errors.load_failed'));
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, [accountId, t]);

  const handleSave = async () => {
    if (!accountId) {
      toast.error(t('mail.errors.account_not_selected'));
      return;
    }
    if (!filterName.trim() || conditions.length === 0) {
      toast.error(t('mail.errors.fill_required_fields'));
      return;
    }
    if (forwardTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardTo.trim())) {
      toast.error(t('mail.errors.invalid_email'));
      return;
    }

    try {
      const payload = {
        accountId, filterName, description, matchType, conditions,
        targetFolderId: targetFolderId || null,
        applyStar, applyRead, deleteMail,
        forwardTo: forwardTo || null,
        isActive: true,
      };

      if (editingFilter) {
        await api.put(`/mail/filters/${editingFilter.id}`, payload);
        toast.success(t('mail.filters.filter_updated'));
      } else {
        await api.post('/mail/filters', payload);
        toast.success(t('mail.filters.filter_created'));
      }
      dispatch({ type: 'CLOSE_DIALOG' });
      fetchFilters();
    } catch (error) {
      toast.error(editingFilter ? t('mail.errors.update_failed') : t('mail.errors.create_failed'));
    }
  };

  const handleToggleActive = async (filter: MailFilter) => {
    try {
      await api.put(`/mail/filters/${filter.id}`, { ...filter, isActive: !filter.isActive });
      toast.success(filter.isActive ? t('mail.filters.deactivate') : t('mail.filters.activate'));
      fetchFilters();
    } catch (error) {
      toast.error(t('mail.errors.update_failed'));
    }
  };

  const handleApplyFilter = async (id: string) => {
    try {
      dispatch({ type: 'SET_APPLYING', payload: id });
      const res = await api.post(`/mail/filters/${id}/apply`);
      toast.success(t('mail.filters.filter_applied', { count: res.matched }));
    } catch (error) {
      toast.error(t('mail.errors.apply_failed'));
    } finally {
      dispatch({ type: 'SET_APPLYING', payload: null });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/mail/filters/${id}`);
      toast.success(t('mail.filters.filter_deleted'));
      fetchFilters();
    } catch (error) {
      toast.error(t('mail.errors.delete_failed'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('mail.filters.title')}
            </CardTitle>
            <CardDescription>{t('mail.filters.subtitle')}</CardDescription>
          </div>
          <Button onClick={() => dispatch({ type: 'OPEN_DIALOG', payload: null })} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('mail.filters.create_new')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <MailFilterList
          filters={filters} folders={folders} loading={loading} applyingFilter={applyingFilter}
          onEdit={(f) => dispatch({ type: 'OPEN_DIALOG', payload: f })}
          onDelete={handleDelete} onToggleActive={handleToggleActive} onApplyFilter={handleApplyFilter}
          onAddNew={() => dispatch({ type: 'OPEN_DIALOG', payload: null })}
        />
      </CardContent>
      <MailFilterForm
        open={dialogOpen} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIALOG' })}
        editingFilter={editingFilter} folders={folders}
        filterName={filterName} onFilterNameChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'filterName', value: v })}
        description={description} onDescriptionChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'description', value: v })}
        matchType={matchType} onMatchTypeChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'matchType', value: v })}
        conditions={conditions} onAddCondition={() => dispatch({ type: 'ADD_CONDITION' })}
        onRemoveCondition={(i) => dispatch({ type: 'REMOVE_CONDITION', index: i })}
        onUpdateCondition={(i, f, v) => dispatch({ type: 'UPDATE_CONDITION', index: i, field: f, value: v })}
        targetFolderId={targetFolderId} onTargetFolderChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'targetFolderId', value: v })}
        applyStar={applyStar} onApplyStarChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'applyStar', value: v })}
        applyRead={applyRead} onApplyReadChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'applyRead', value: v })}
        deleteMail={deleteMail} onDeleteMailChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'deleteMail', value: v })}
        forwardTo={forwardTo} onForwardToChange={(v) => dispatch({ type: 'UPDATE_FIELD', field: 'forwardTo', value: v })}
        onSave={handleSave}
      />
    </Card>
  );
}

