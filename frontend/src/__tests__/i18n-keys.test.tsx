import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useTranslation } from '../lib/i18n';

// A simple component that uses useTranslation
function TestComponent({ translationKey, params }: { translationKey: string; params?: any }) {
  const { t } = useTranslation();
  return <div data-testid="translation">{t(translationKey, params)}</div>;
}

describe('i18n Keys Loading and Formatting Check', () => {
  it('should load root-level and nested i18n keys correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="common.status" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Статус');
  });

  it('should load mail module translation keys correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="mail.loading_more" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Загрузка еще...');
  });

  it('should load projects module translation keys correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="projects.stages.back_to_list" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Назад к списку');
  });

  it('should load bulk edit settings translations from common correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="common.bulk_edit.settings.editor_title" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Массовое редактирование');
  });

  it('should load note uploader translations correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="common.add_file" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Добавить файл');
  });

  it('should perform parameter interpolation correctly', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="common.file_too_large" params={{ size: '10MB' }} />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('Файл слишком большой. Максимум: 10MB');
  });

  it('should return key name as fallback if the key is missing', () => {
    render(
      <I18nProvider>
        <TestComponent translationKey="non_existent_key_123" />
      </I18nProvider>
    );
    expect(screen.getByTestId('translation').textContent).toBe('non_existent_key_123');
  });
});
