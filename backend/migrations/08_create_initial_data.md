# Migration 08: Create Initial Data

## Description
Insert initial data into the database tables based on the existing mock data.

## SQL Statements

### Insert Initial Projects
```sql
INSERT INTO projects (id, name, client, manager, status, stage, priority, budgetUsed, budget, deadline, tasksCount, completedTasks) VALUES
(1, 'Внедрение системы безопасности', 'ПАО "Газпром"', 'Мария Менеджер', 'pending', 'todo', 'Medium', 0, 2500000, '2024-03-12', 12, 0),
(2, 'Модернизация IT-инфраструктуры', 'ООО ТИТАН', 'Александр Админ', 'active', 'in_progress', 'High', 45, 5000000, '2024-06-01', 45, 18),
(3, 'Разработка CRM-системы', 'Вектор', 'Иван Петров', 'active', 'review', 'High', 72, 1800000, '2024-02-20', 28, 25),
(4, 'Маркетинговая кампания Q2', 'ТехноПром', 'Елена Дизайн', 'active', 'in_progress', 'Low', 15, 800000, '2024-04-30', 15, 3),
(5, 'Аудит бухгалтерии', 'СтройИнвест', 'Анна Тех', 'paused', 'done', 'Medium', 100, 300000, '2024-01-15', 8, 8);
```

### Insert Initial Contractors
```sql
INSERT INTO contractors (id, name, full_name, status, phone, manager, inn, kpp, legal_form) VALUES
(1, 'ООО ТИТАН', 'Общество с ограниченной ответственностью ТИТАН', 'active', '—', 'Александр Админ', '7701002003', '770101001', 'ooo'),
(2, 'Газпром', 'Публичное акционерное общество Газпром', 'vip', '—', 'Мария Менеджер', '7736050003', '772801001', 'ooo'),
(3, 'ИП Иванов И.И.', 'Индивидуальный предприниматель Иванов Иван Иванович', 'active', '—', 'Мария Менеджер', NULL, NULL, 'ip'),
(4, 'ТехноПром', 'ООО ТехноПром', 'pending', '+7 (495) 123-45-67', 'Иван Петров', NULL, NULL, 'ooo'),
(5, 'СтройИнвест', 'ООО СтройИнвест', 'active', '+7 (495) 987-65-43', 'Александр Админ', NULL, NULL, 'ooo');
```

### Insert Initial Contractor Tags
```sql
INSERT INTO contractor_tags (id, contractor_id, tag) VALUES
(1, 2, 'VIP'),
(2, 2, 'Госсектор'),
(3, 3, 'Производство'),
(4, 4, 'Производство'),
(5, 5, 'VIP');
```

### Insert Initial Documents
```sql
INSERT INTO documents (id, name, type, size, date, parent_Id, starred) VALUES
('1', 'Договоры 2024', 'folder', NULL, '2024-01-12', NULL, FALSE),
('2', 'Маркетинг материалы', 'folder', NULL, '2024-02-15', NULL, FALSE),
('3', 'Финансовые отчеты', 'folder', NULL, '2024-03-10', NULL, FALSE),
('4', 'Презентация продукта.pdf', 'pdf', '2.4 MB', 'Вчера', NULL, TRUE),
('5', 'Логотип.png', 'image', '1.2 MB', '2024-03-12', NULL, FALSE),
('6', 'Бюджет Q1.xlsx', 'xls', '450 KB', '2024-02-28', NULL, FALSE),
('11', 'Газпром.docx', 'doc', '125 KB', '2024-01-12', '1', FALSE),
('12', 'ТИТАН Лицензия.pdf', 'pdf', '5.1 MB', '2024-01-14', '1', TRUE);
```

### Insert Initial Users
```sql
INSERT INTO users (id, name, initials, role, status, avatar, department, email, specializations) VALUES
(1, 'Мария Менеджер', 'ММ', 'Manager', 'active', 'ММ', 'Management', NULL, 'Marketing'),
(2, 'Александр Админ', 'АА', 'Admin', 'active', 'АА', 'Administration', NULL,'loyer'),
(3, 'Иван Петров', 'ИП', 'Developer', 'active', 'ИП', 'IT', NULL, 'IT'),
(4, 'Елена Дизайн', 'ЕД', 'Designer', 'active', 'ЕД', 'Marketing', NULL, 'Design'),
(5, 'Анна Тех', 'АТ', 'Engineer', 'active', 'АТ', 'IT', NULL, 'IT'  ),
(6, 'Мария Иванова', 'МИ', 'Analyst', 'active', 'МИ', 'Analytics', NULL, 'Analytics');
```

### Insert Initial Mail
```sql
INSERT INTO mail (id, sender, senderEmail, avatar, subject, preview, content, date, read, label) VALUES
('1', 'Алексей Смирнов', 'a.smirnov@client.com', 'АС', 'Согласование договора поставки', 'Добрый день! Высылаю обновленную версию договора с правками...', 'Добрый день!\n\nВысылаю обновленную версию договора с правками от нашего юридического отдела. Прошу ознакомиться и дать обратную связь до конца недели.\n\nОсновные изменения касаются сроков поставки и условий оплаты.\n\nС уважением,\nАлексей Смирнов', '10:30', FALSE, 'work'),
('2', 'Мария Иванова', 'm.ivanova@titan.com', 'МИ', 'Отчет за прошлый месяц', 'Привет! Подготовила сводный отчет по продажам за март...', 'Привет!\n\nПодготовила сводный отчет по продажам за март. Показатели выросли на 15% по сравнению с февралем.\n\nФайл во вложении.\n\nМария', 'Вчера', TRUE, 'important'),
('3', 'Поддержка Сервиса', 'support@service.io', 'SP', 'Обновление условий обслуживания', 'Мы обновили нашу политику конфиденциальности...', 'Уважаемый пользователь,\n\nМы обновили нашу политику конфиденциальности и условия использования сервиса. Изменения вступают в силу с 1 мая.\n\nКоманда поддержки', '15 мар', TRUE, NULL);
```