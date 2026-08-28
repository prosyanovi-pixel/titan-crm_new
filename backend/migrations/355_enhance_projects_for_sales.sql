-- Migration 355: Enhance Projects for Sales Orchestration

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deadline_order DATE,
  ADD COLUMN IF NOT EXISTS deadline_payment DATE;

CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_workflow ON projects(workflow_id);

-- Define basic Sales workflow template if not exists
DO $$
DECLARE
  v_workflow_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Стандартная продажа') THEN
    INSERT INTO workflows (name, description, trigger_type, status)
    VALUES ('Стандартная продажа', 'Воронка для прямых продаж оборудования', 'event', 'active')
    RETURNING id INTO v_workflow_id;
    
    -- Insert default steps for visualization/stages
    -- Even if workflow is primarily for stages, we can define steps
    INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config)
    VALUES 
    (v_workflow_id, 1, 'sales', 'stage_change', '{"stageName": "Новая", "color": "blue"}'),
    (v_workflow_id, 2, 'sales', 'stage_change', '{"stageName": "КП отправлено", "color": "yellow"}'),
    (v_workflow_id, 3, 'sales', 'stage_change', '{"stageName": "Согласование договора", "color": "orange", "autoTask": {"role": "lawyer", "title": "Проверить договор"}}'),
    (v_workflow_id, 4, 'sales', 'stage_change', '{"stageName": "Выставление счета", "color": "purple", "autoTask": {"role": "accountant", "title": "Выставить счет клиенту"}}'),
    (v_workflow_id, 5, 'sales', 'stage_change', '{"stageName": "Оплата получена", "color": "teal"}'),
    (v_workflow_id, 6, 'sales', 'stage_change', '{"stageName": "Успешно реализовано", "color": "green", "isWon": true}');
  END IF;
END $$;
