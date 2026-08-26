# Migration 60: Create courts and judges tables

## Purpose
Add support for courts and judges entities in the legal cases module.

## Changes
- Creates `courts` table for storing court information
- Creates `judges` table with foreign key to courts
- Seeds initial court and judge data

## SQL

```sql
-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  court_id VARCHAR(50) REFERENCES courts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial courts data
INSERT INTO courts (id, name, address) VALUES 
  ('c1', 'Арбитражный суд г. Москвы', 'ул. Большая Тульская, 17'),
  ('c2', 'Басманный районный суд', 'ул. Каланчевская, 11'),
  ('c3', 'Девятый арбитражный апелляционный суд', 'пр. Соломенной Сторожки, 12')
ON CONFLICT (id) DO NOTHING;

-- Seed initial judges data
INSERT INTO judges (id, name, court_id) VALUES 
  ('j1', 'Иванова А.А.', 'c1'),
  ('j2', 'Петров П.П.', 'c1'),
  ('j3', 'Смирнова С.С.', 'c2'),
  ('j4', 'Кузнецов К.К.', 'c3')
ON CONFLICT (id) DO NOTHING;
```
