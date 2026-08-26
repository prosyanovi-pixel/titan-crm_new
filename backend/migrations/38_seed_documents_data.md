# Seed: documents

Скрипт для заполнения таблицы `documents` примерными данными.

## Структура таблицы

- `id`: `VARCHAR` (например, 'folder-1', 'doc-1')
- `name`: `VARCHAR(255)`
- `type`: `VARCHAR(10)` ('file' или 'folder')
- `size`: `VARCHAR` (например, '2.5 MB')
- `date`: `DATE`
- `parent_id`: `VARCHAR`, ссылается на `documents.id`
- `starred`: `BOOLEAN`

---

## 1. Очистка таблицы

```sql
DELETE FROM documents;
```

---

## 2. Вставка данных

### 2.1. Корневые папки

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('folder-1', 'Проекты', 'folder', NULL, '2024-01-15', NULL, false),
('folder-2', 'Договоры', 'folder', NULL, '2024-01-10', NULL, true),
('folder-3', 'Отчёты', 'folder', NULL, '2024-02-01', NULL, false),
('folder-4', 'Шаблоны', 'folder', NULL, '2024-02-05', NULL, false);
```

### 2.2. Корневые файлы

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-1', 'Инструкция по использованию.pdf', 'pdf', '2.5 MB', '2024-01-20', NULL, true),
('doc-2', 'Презентация компании.pptx', 'doc', '5.8 MB', '2024-01-22', NULL, false),
('doc-3', 'Фотографии офиса.zip', 'archive', '125 MB', '2024-01-25', NULL, false);
```

### 2.3. Файлы в папке "Проекты"

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-4', 'Проект Alpha - план.docx', 'doc', '1.2 MB', '2024-01-16', 'folder-1', true),
('doc-5', 'Проект Beta - бюджет.xlsx', 'xls', '890 KB', '2024-01-17', 'folder-1', false),
('doc-6', 'Проект Gamma - отчёт.pdf', 'pdf', '3.4 MB', '2024-01-18', 'folder-1', false),
('doc-7', 'Схема проекта.png', 'image', '2.1 MB', '2024-01-19', 'folder-1', false);
```

### 2.4. Файлы в папке "Договоры"

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-8', 'Договор с Клиентом А.docx', 'doc', '450 KB', '2024-01-11', 'folder-2', true),
('doc-9', 'Договор с Поставщиком Б.pdf', 'pdf', '1.8 MB', '2024-01-12', 'folder-2', false),
('doc-10', 'Дополнительное соглашение.docx', 'doc', '320 KB', '2024-01-13', 'folder-2', false);
```

### 2.5. Файлы в папке "Отчёты"

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-11', 'Квартальный отчёт Q1.xlsx', 'xls', '2.3 MB', '2024-02-02', 'folder-3', false),
('doc-12', 'Годовой отчёт 2023.pdf', 'pdf', '4.5 MB', '2024-02-03', 'folder-3', true),
('doc-13', 'Аналитика продаж.xlsx', 'xls', '1.9 MB', '2024-02-04', 'folder-3', false);
```

### 2.6. Файлы в папке "Шаблоны"

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-14', 'Шаблон договора.docx', 'doc', '150 KB', '2024-02-06', 'folder-4', false),
('doc-15', 'Шаблон счёта.xlsx', 'xls', '85 KB', '2024-02-07', 'folder-4', false),
('doc-16', 'Шаблон акта.docx', 'doc', '120 KB', '2024-02-08', 'folder-4', false);
```

### 2.7. Недавно добавленные файлы

```sql
INSERT INTO documents (id, name, type, size, date, parent_id, starred) VALUES
('doc-17', 'Новый проект.docx', 'doc', '780 KB', '2024-02-09', NULL, true),
('doc-18', 'Скриншот интерфейса.png', 'image', '1.2 MB', '2024-02-10', NULL, false),
('doc-19', 'Архив документов 2024.zip', 'archive', '250 MB', '2024-02-11', NULL, false);
```