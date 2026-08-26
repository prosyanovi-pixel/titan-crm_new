-- Insert legal forms grouped by category

-- Clear existing
DELETE FROM legal_form;

-- Legal entities
INSERT INTO legal_form (id, name, group_id, color) VALUES
('ooo', 'ООО', 'legal', '#3B82F6'),
('pao', 'ПАО', 'legal', '#3B82F6'),
('ao', 'АО', 'legal', '#3B82F6'),
('nano', 'НАО', 'legal', '#3B82F6'),
('zao', 'ЗАО', 'legal', '#3B82F6'),
('oao', 'ОАО', 'legal', '#3B82F6'),
('ano', 'АНО', 'legal', '#3B82F6'),
('np', 'НП', 'legal', '#3B82F6'),
('gup', 'ГУП', 'legal', '#3B82F6'),
('mup', 'МУП', 'legal', '#3B82F6');

-- Individual entrepreneurs
INSERT INTO legal_form (id, name, group_id, color) VALUES
('ip', 'ИП', 'individual', '#10B981');

-- Private individuals
INSERT INTO legal_form (id, name, group_id, color) VALUES
('self', 'Самозанятый', 'private', '#F59E0B'),
('private', 'Физическое лицо', 'private', '#F59E0B');

-- Foreign organizations
INSERT INTO legal_form (id, name, group_id, color) VALUES
('foreign', 'Иностранная организация', 'foreign', '#EF4444');
